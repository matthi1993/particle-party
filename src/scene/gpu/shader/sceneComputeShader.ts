export const WORKGROUP_SIZE = 32;

// ── Tuning knobs ─────────────────────────────────────────────────────────────
// Collision repulsion: strength of the short-range universal repulsion force
export const REPULSION_STRENGTH = 1.0;

// Type-force fade: fraction of interactionDist at which the type force starts fading out (0..1)
export const TYPE_FORCE_FADE_START = 0.85;

// Density spreading: how many multiples of myType.size the same-type repulsion radius extends
export const DENSITY_RADIUS_FACTOR = 4.0;

// Density spreading strength: magnitude of the per-pair same-type repulsion
export const DENSITY_STRENGTH = 0.5;
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
        mass: f32,       // 4 bytes (to align the struct to 16 bytes)
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

    @group(0) @binding(0) var<storage> particles: array<Particle>;
    @group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;

    @group(0) @binding(2) var<storage> particleTypes: array<ParticleType>;
    @group(0) @binding(3) var<storage> forces: array<Force>;

    @group(0) @binding(4) var<uniform> uniforms: Uniforms;

    var<workgroup> sharedParticles: array<Particle, ${WORKGROUP_SIZE}>; // Shared memory for particles in workgroup

    fn safeNormalize(v: vec4f) -> vec4f {
        let len = length(v);
        if (len > 1e-6) { return v / len; }
        return vec4f(0, 0, 0, 0);
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

        // Build force lookup: myForces[otherTypeId] = attraction/repulsion strength
        // Positive = attract, negative = repel
        var myForces: array<f32, 16>; // TODO 16 is the max number of types currently
        var forceCounter = 0;
        for (var i: u32 = 0; i < arrayLength(&forces); i++) {
            if (forces[i].idParticleA == me.particleAttributes.x) {
                myForces[forceCounter] = forces[i].force;
                forceCounter++;
            }
        }

        var totalForce: vec4f = vec4f(0, 0, 0, 0);

        // Interaction radii
        let collisionDist   = myType.size;                                // repulsion zone
        let interactionDist = myType.radius;                              // type-force cutoff
        let densityRadius   = myType.size * ${DENSITY_RADIUS_FACTOR};    // same-type spread radius

        // Loop over all particles in workgroup-sized chunks
        for (var chunkStart = 0u; chunkStart < numParticles; chunkStart += ${WORKGROUP_SIZE}) {

            // Load the current chunk into shared memory
            let chunkIndex = chunkStart + local_id.x;
            if (chunkIndex < numParticles) {
                sharedParticles[local_id.x] = particles[chunkIndex];
            }
            workgroupBarrier();

            for (var i = 0u; i < ${WORKGROUP_SIZE}; i++) {
                if (chunkStart + i >= numParticles) { break; }
                if (chunkStart + i == index) { continue; } // skip self

                let other = sharedParticles[i];

                let delta = me.position - other.position; // points from other → me
                let dist  = length(delta);
                let dir   = safeNormalize(delta);

                let forceMag   = myForces[i32(other.particleAttributes.x)] * uniforms.attractionFactor;
                let isSameType = select(0.0, 1.0, other.particleAttributes.x == me.particleAttributes.x);

                // ── Repulsion weight ──
                // Quadratic: 1 at contact, smoothly reaches 0 at collisionDist. No hard cutoff.
                let repW = pow(1.0 - clamp(dist / collisionDist, 0.0, 1.0), 2.0);

                // ── Type-force weight ──
                // Smoothly fades IN past the collision zone, smoothly fades OUT near interactionDist.
                // Product of two smoothsteps naturally forms a single continuous hill — no if/else needed.
                let typeInW  = smoothstep(0.0, collisionDist, dist);
                let typeOutW = 1.0 - smoothstep(interactionDist * ${TYPE_FORCE_FADE_START}, interactionDist, dist);
                let typeW    = typeInW * typeOutW;

                // ── Density-spreading weight (same-type only) ──
                // Quadratic per-pair repulsion that fades to zero at densityRadius.
                let densW = pow(max(0.0, 1.0 - dist / densityRadius), 2.0);

                totalForce += dir * repW  * ${REPULSION_STRENGTH};   // collision repulsion
                totalForce -= dir * forceMag * typeW;                 // type attraction / repulsion
                totalForce += dir * densW * ${DENSITY_STRENGTH};     // density spreading
            }

            workgroupBarrier();
        }

        // ── Integrate ──
        me.velocity = (me.velocity + totalForce) * 0.5;
        me.position += me.velocity;

        // ── Bounding Sphere ──
        let size = uniforms.worldSize;
        if (length(me.position) >= size) {
            me.velocity = me.velocity * -1.0;
            me.position += me.velocity;
            me.velocity = vec4f(0, 0, 0, 0);
        }

        particlesOut[index] = me;
    }
`
