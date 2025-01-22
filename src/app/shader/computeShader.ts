export const WORKGROUP_SIZE = 64;

export const computeShader = `

    struct Particle {
        position: vec4f,
        velocity: vec4f,
        particleAttributes: vec4f
    }

    struct ParticleType {
        color: vec4f,    // 16 bytes
        id: f32,         // 4 bytes
        radius: f32,     // 4 bytes
        _padding: vec2f, // 8 bytes (to align the struct to 16 bytes)
    }

    struct Force {
        idParticleA: f32,   // 4 bytes
        idParticleB: f32,   // 4 bytes
        force: f32,         // 4 bytes
    }

    @group(0) @binding(0) var<storage> particles: array<Particle>;
    @group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;

    @group(0) @binding(2) var<storage> particleTypes: array<ParticleType>;
    @group(0) @binding(3) var<storage> forces: array<Force>;

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

        let me = particles[index];
        let myType = particleTypes[i32(me.particleAttributes.x)];

        let numParticles = arrayLength(&particles);
        let innerRadius = f32(5); // todo configurable

        var forceCounter = 0;
        var myForces: array<f32, 16>; // TODO 16 is the max number of types currently
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

                let direction = me.position - other.position;
                let distanceSquared = max(dot(direction, direction), 1e-6); // Avoid division by zero
                let distance = sqrt(distanceSquared);


                if (distance > 0.0 && distance <= innerRadius) {
                    force += normalizeVector(direction) * 1;
                } else if (distance > innerRadius && distance < myType.radius) {
                    var gravity = myForces[i32(other.particleAttributes.x)];
                    let forceMagnitude = gravity / distance;
                    force += normalizeVector(direction) * forceMagnitude;
                }
            }

            workgroupBarrier(); // Synchronize before loading the next chunk
        }






        // Update the velocity and position of the particle

        let size = f32(600);

        var particle = me;
        particle.velocity = (particle.velocity + force) * 0.75;


        particle.position += particle.velocity;


        if(particle.position.x > size || particle.position.x < -1 * size) {
            particle.velocity.x = particle.velocity.x * -1;
            particle.position.x += particle.velocity.x;
        }
        if(particle.position.y > size || particle.position.y < -1 * size) {
            particle.velocity.y = particle.velocity.y * -1;
            particle.position.y += particle.velocity.y;
        }
        if(particle.position.z > size || particle.position.z < -1 * size) {
            particle.velocity.z = particle.velocity.z * -1;
            particle.position.z += particle.velocity.z;
        }

        particlesOut[index] = particle;
        
    }
`