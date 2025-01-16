export const WORKGROUP_SIZE = 64;

export const computeShader = `

    struct Particle {
        position: vec4f,
        velocity: vec4f,
        particleAttributes: vec4f
    }

    @group(0) @binding(0) var<storage> particles: array<Particle>;
    @group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;

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
        let numParticles = arrayLength(&particles);
        let index = global_id.x;

        let me = particles[index];

        // Initialize force accumulator
        var force: vec4f = vec4f(0, 0,0,0);
        let forceRadius = f32(80); // TODO get from input, make different per particle

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

                if (distance > 0 && distance < forceRadius) {
                    var gravityByType = f32(0);

                    if (me.particleAttributes.x == 0 && other.particleAttributes.x == 0) {
                        gravityByType = -2;
                    }
                    if (me.particleAttributes.x == 0 && other.particleAttributes.x == 1) {
                        gravityByType = 0.2;
                    }
                    if (me.particleAttributes.x == 0 && other.particleAttributes.x == 2) {
                        gravityByType = 0.1;
                    }
                    if (me.particleAttributes.x == 0 && other.particleAttributes.x == 3) {
                        gravityByType = 0.8;
                    }



                    if (me.particleAttributes.x == 1 && other.particleAttributes.x == 0) {
                        gravityByType = 0.3;
                    }   
                    if (me.particleAttributes.x == 1 && other.particleAttributes.x == 1) {
                        gravityByType = 0.2;
                    }
                    if (me.particleAttributes.x == 1 && other.particleAttributes.x == 2) {
                        gravityByType = -0.3;
                    }
                    if (me.particleAttributes.x == 1 && other.particleAttributes.x == 3) {
                        gravityByType = 0.1;
                    }



                    if (me.particleAttributes.x == 2 && other.particleAttributes.x == 0) {
                        gravityByType = 0.3;
                    }
                    if (me.particleAttributes.x == 2 && other.particleAttributes.x == 1) {
                       gravityByType = -0.3;
                    }
                    if (me.particleAttributes.x == 2 && other.particleAttributes.x == 2) {
                        gravityByType = 0.9;
                    }
                    if (me.particleAttributes.x == 2 && other.particleAttributes.x == 3) {
                        gravityByType = 0.3;
                    }

                    

                    if (me.particleAttributes.x == 3 && other.particleAttributes.x == 0) {
                        gravityByType = 0.3;
                    }
                    if (me.particleAttributes.x == 3 && other.particleAttributes.x == 1) {
                       gravityByType = 0.4;
                    }
                    if (me.particleAttributes.x == 3 && other.particleAttributes.x == 2) {
                        gravityByType = 0.1;
                    }
                    if (me.particleAttributes.x == 3 && other.particleAttributes.x == 3) {
                        gravityByType = 0.2;
                    }

                    // Example: Gravitational force
                    let forceMagnitude = gravityByType / distance;
                    force += normalizeVector(direction) * forceMagnitude;
                }
            }

            workgroupBarrier(); // Synchronize before loading the next chunk
        }

        // Update the velocity and position of the particle

        let size = f32(300);

        var particle = me;
        particle.velocity = (particle.velocity + force) * 0.5;


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