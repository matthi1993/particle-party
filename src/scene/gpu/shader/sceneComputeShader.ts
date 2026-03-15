export const WORKGROUP_SIZE = 32;

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

    fn normalizeVector(v: vec4f) -> vec4f {
        let len = length(v); // Calculate the magnitude (length) of the vector
        if (len > 0.0) {
            return v / len; // Divide the vector by its length
        }
        return vec4f(0,0,0,0); // Handle the zero-length vector case
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

        var myForces: array<f32, 16>; // TODO 16 is the max number of types currently
        
        
        var forceCounter = 0;
        for (var i: u32 = 0; i < arrayLength(&forces); i++) {
            if(forces[i].idParticleA == me.particleAttributes.x) {
                myForces[forceCounter] = forces[i].force;
                forceCounter++;
            }
        }

        // Initialize force accumulator
        var force: vec4f = vec4f(0, 0,0,0);

        // Loop over all particles in chunks
        for (var chunkStart = 0u; chunkStart < numParticles; chunkStart += ${WORKGROUP_SIZE}) {

            // Load the current chunk into shared memory
            let chunkIndex = chunkStart + local_id.x;
            if (chunkIndex < numParticles) {
                sharedParticles[local_id.x] = particles[chunkIndex];
            }

            workgroupBarrier(); // Ensure all threads have loaded the data


            // Calculate interactions with particles in shared memory
            for (var i = 0u; i < ${WORKGROUP_SIZE}; i++) {
                
                // stop loop if no more particles left
                if (chunkStart + i >= numParticles) {
                    break;
                }
                    
                let other = sharedParticles[i];
                let otherType = particleTypes[i32(other.particleAttributes.x)];

                let direction = me.position - other.position;
                let distanceSquared = max(dot(direction, direction), 1e-6); // Avoid division by zero
                let distance = sqrt(distanceSquared);
                let dir = normalizeVector(direction);

                // Smooth transition width (controls how gradual the blend is)
                let transitionWidth = myType.size * 0.2;

                // ##### Blend weights using smoothstep for continuous transitions #####

                // innerWeight: 1.0 when deep inside size, smoothly fades to 0 at size boundary
                let innerWeight = 1.0 - smoothstep(myType.size - transitionWidth, myType.size + transitionWidth, distance);

                // outerWeight: 0.0 inside size, smoothly rises to 1 at size boundary
                let outerWeight = smoothstep(myType.size - transitionWidth, myType.size + transitionWidth, distance);

                // attractionWeight: 1.0 near size edge, smoothly fades to 0 at radius boundary
                let radiusTransition = (myType.radius - myType.size) * 0.15;
                let attractionWeight = outerWeight * (1.0 - smoothstep(myType.radius - radiusTransition, myType.radius + radiusTransition, distance));

                // ##### inner atomic repulsion force (blended) #####
                let smoothness = 0.15;
                let diff = 1.0 / (pow(myType.size, smoothness)) * (pow(max(distance, 1e-6), smoothness)) - 1.0;
                let repulsionForce = diff * dir;
                force -= innerWeight * repulsionForce;

                // ##### attraction force (blended) #####
                let relativeDistance = distance - myType.size;
                let relativeRadius = myType.radius - myType.size;
                let t = clamp(relativeDistance / max(relativeRadius, 1e-6), 0.0, 1.0);
                let decayRate = 5.0;
                let electricAttraction = (exp(-decayRate * t) - exp(-decayRate)) / (1.0 - exp(-decayRate));
                let forceMagnitude = myForces[i32(other.particleAttributes.x)] * uniforms.attractionFactor;
                force -= attractionWeight * electricAttraction * forceMagnitude * dir;

                // ##### gravity force (blended, fades in outside size) #####
                let gravityMagnitude = uniforms.G * otherType.mass / (distanceSquared + 1e-6);
                force -= outerWeight * gravityMagnitude * dir;
            }

            workgroupBarrier(); // Synchronize before loading the next chunk
        }







        let size = uniforms.worldSize;

        // ##### Update the velocity and position of the particle #####
        me.velocity = (me.velocity + force) * 0.5;
        me.position += me.velocity;


        // ##### Bounding Sphere #####
        if(length(me.position) >= size) {
            me.velocity = me.velocity * -1.0;
            me.position += me.velocity;
            me.velocity = vec4f(0, 0,0,0);

        }

        particlesOut[index] = me;
    }
`