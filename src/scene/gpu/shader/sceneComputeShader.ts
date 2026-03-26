export const WORKGROUP_SIZE = 32;

// ── Tuning knobs ─────────────────────────────────────────────────────────────

// Particle Life — inner repulsion zone as a fraction of interactionDist.
// Below this normalized distance the universal repulsion dominates.
// Above it the type-specific attraction/repulsion takes over.
// Range: 0.0 (no repulsion zone) → 1.0 (all repulsion, no attraction)
export const BETA = 0.3;

// Global scale applied to all pair forces (repulsion + attraction).
export const FORCE_SCALE = 0.5;

// SPH — smoothing radius as a multiple of myType.size.
// Larger = density estimated over more neighbours → smoother pressure.
export const DENSITY_RADIUS_FACTOR = 3.00;

// SPH — rest density. Pressure builds when local density exceeds this.
// Increase to allow denser packing before pressure kicks in.
export const REST_DENSITY = 5.0;

// SPH — how strongly density excess converts to an outward pressure force.
export const DENSITY_STRENGTH = 0.3;

// Velocity damping per frame (0 = instant stop, 1 = no friction).
export const DAMPING = 0.85;

// ─────────────────────────────────────────────────────────────────────────────

export const sceneComputeShader = `

    struct Particle {
        position: vec4f,
        velocity: vec4f,
        particleAttributes: vec4f
    }

    struct ParticleType {
        color: vec4f,    // 16 bytes
        id: f32,         // 4 bytes
        radius: f32,     // 4 bytes
        size: f32,       // 4 bytes
        mass: f32,       // 4 bytes
    }

    struct Force {
        idParticleA: f32,   // 4 bytes
        idParticleB: f32,   // 4 bytes
        force: f32,         // 4 bytes
    }

    struct Uniforms {
        G: f32,
        attractionFactor: f32,
        worldSize: f32,
    }

    @group(0) @binding(0) var<storage>            particles:    array<Particle>;
    @group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;
    @group(0) @binding(2) var<storage>            particleTypes: array<ParticleType>;
    @group(0) @binding(3) var<storage>            forces:        array<Force>;
    @group(0) @binding(4) var<uniform>            uniforms:      Uniforms;

    var<workgroup> sharedParticles: array<Particle, ${WORKGROUP_SIZE}>;

    fn safeNormalize(v: vec4f) -> vec4f {
        let len = length(v);
        if (len > 1e-6) { return v / len; }
        return vec4f(0, 0, 0, 0);
    }

    // ── Particle Life force (Hunar Ahmed / Jeffrey Ventrella) ────────────────
    // r          : normalized distance [0, 1] where 1 = interactionDist
    // beta       : inner zone boundary (fraction of interaction radius)
    // attraction : type-pair coefficient from the force matrix [-1, 1]
    //
    // Returns a scalar along the toward-other axis:
    //   negative → repulsion (push away)
    //   positive → attraction (pull toward)
    //
    //  f
    //  │        ╭──peak──╮   ← attraction * bell
    //  0 ───────╯        ╰─── dist/radius
    //  │╲ ← linear repulsion
    //  │ ╲
    //  │  0=beta
    //
    fn particleLifeForce(r: f32, beta: f32, attraction: f32) -> f32 {
        if (r < beta) {
            // Linear ramp: -1 at contact, 0 at beta. Universal, ignores attraction.
            return r / beta - 1.0;
        }
        if (r < 1.0) {
            // Triangular peak: 0 at beta, peak at midpoint, 0 at 1.
            let t = (r - beta) / (1.0 - beta);           // 0 → 1 across outer zone
            return attraction * (1.0 - abs(2.0 * t - 1.0)); // triangle wave
        }
        return 0.0;
    }

    // ── SPH kernels ──────────────────────────────────────────────────────────

    // Poly6 kernel — smooth, used for density estimation.
    // W(r, h) = (1 − (r/h)²)³   for r < h, else 0
    fn kernelPoly6(dist: f32, h: f32) -> f32 {
        let q = dist / max(h, 1e-6);
        if (q >= 1.0) { return 0.0; }
        let x = 1.0 - q * q;
        return x * x * x;
    }

    // Spiky kernel gradient magnitude — steeper near contact, used for pressure.
    // |∇W(r, h)| ∝ (1 − r/h)²   for r < h, else 0
    fn kernelSpikyGrad(dist: f32, h: f32) -> f32 {
        let q = dist / max(h, 1e-6);
        if (q >= 1.0) { return 0.0; }
        let x = 1.0 - q;
        return x * x;
    }

    @compute @workgroup_size(${WORKGROUP_SIZE})
    fn computeMain(
        @builtin(global_invocation_id) global_id: vec3<u32>,
        @builtin(local_invocation_id) local_id: vec3<u32>,
        @builtin(workgroup_id) workgroup_id: vec3<u32>
    ) {
        let index = global_id.x;
        var me = particles[index];
        let myType = particleTypes[i32(me.particleAttributes.x)];
        let numParticles = arrayLength(&particles);

        // Build type-pair force lookup from the force matrix.
        // myForces[otherTypeId] = attraction coefficient in [-1, 1]
        var myForces: array<f32, 16>; // 16 = max supported particle types
        var fc = 0;
        for (var i: u32 = 0; i < arrayLength(&forces); i++) {
            if (forces[i].idParticleA == me.particleAttributes.x) {
                myForces[fc] = forces[i].force;
                fc++;
            }
        }

        var totalForce:   vec4f = vec4f(0, 0, 0, 0);
        var density:      f32   = 0.0;   // SPH local density estimate
        var pressureGrad: vec4f = vec4f(0, 0, 0, 0); // SPH pressure gradient direction

        let interactionDist = myType.radius;
        let beta            = clamp(myType.size / max(interactionDist, 1e-6), 0.01, 0.99);
        let sphRadius       = myType.size * ${DENSITY_RADIUS_FACTOR};

        // ── Main particle loop (tiled for workgroup shared memory) ────────────
        for (var chunkStart = 0u; chunkStart < numParticles; chunkStart += ${WORKGROUP_SIZE}) {

            let chunkIndex = chunkStart + local_id.x;
            if (chunkIndex < numParticles) {
                sharedParticles[local_id.x] = particles[chunkIndex];
            }
            workgroupBarrier();

            for (var i = 0u; i < ${WORKGROUP_SIZE}; i++) {
                if (chunkStart + i >= numParticles) { break; }
                if (chunkStart + i == index) { continue; } // skip self

                let other = sharedParticles[i];
                let delta = me.position - other.position; // away from other
                let dist  = length(delta);
                let dir   = safeNormalize(delta);

                // ── Particle Life force ──────────────────────────────────────
                // f < 0 → repulsion: dir points away → subtracting a negative adds force away ✓
                // f > 0 → attraction: subtracting a positive pulls toward other ✓
                let r          = dist / max(interactionDist, 1e-6);
                let attraction = myForces[i32(other.particleAttributes.x)] * uniforms.attractionFactor;
                let f          = particleLifeForce(r, beta, attraction) * ${FORCE_SCALE};
                totalForce -= dir * f;

                // ── SPH density + pressure gradient ──────────────────────────
                // Accumulated for all neighbours regardless of type.
                // Poly6 for density (smooth), Spiky gradient for pressure (sharper near contact).
                density      += kernelPoly6(dist, sphRadius);
                pressureGrad += dir * kernelSpikyGrad(dist, sphRadius);
            }

            workgroupBarrier();
        }

        // ── SPH pressure force ───────────────────────────────────────────────
        // Pressure = max(0, density − restDensity) × strength.
        // tanh saturates the gradient magnitude so dense clusters can't produce
        // unbounded forces and cause jitter.
        let densityExcess = max(0.0, density - ${REST_DENSITY});
        if (densityExcess > 0.0) {
            let gradLen = length(pressureGrad);
            if (gradLen > 1e-6) {
                totalForce += (pressureGrad / gradLen)
                            * tanh(gradLen)
                            * densityExcess
                            * ${DENSITY_STRENGTH};
            }
        }

        // ── Integrate ────────────────────────────────────────────────────────
        me.velocity += totalForce * 0.25;  // apply force as acceleration
        me.velocity *= ${DAMPING};         // uniform drag / friction
        me.position += me.velocity;

        // ── Bounding Sphere ──────────────────────────────────────────────────
        let size = uniforms.worldSize;
        if (length(me.position) >= size) {
            me.velocity  = me.velocity * -1.0;
            me.position += me.velocity;
            me.velocity  = vec4f(0, 0, 0, 0);
        }

        particlesOut[index] = me;
    }
`
