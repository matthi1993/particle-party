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
        size: f32,       // 4 bytes
        mass: f32,       // 4 bytes (to align the struct to 16 bytes)
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
        let G = f32(0.006674);
        let attractionFactor = 0.05;

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

                // ##### inner atomar force #####
                if (distance > 0.0 && distance <= myType.size) {
                    let diff = myType.size - distance;
                    force += normalizeVector(direction) * diff;
                } else {
                    
                    // ##### attraction force #####
                    if (distance > 0.0 && distance <= myType.radius){
                        var attraction = myForces[i32(other.particleAttributes.x)] * attractionFactor;
                        let forceMagnitude = attraction / (distance + 1e-6);
                        
                        force += normalizeVector(direction) * forceMagnitude;
                    }

                    // ##### gravity force #####
                    let gravityMagnitude = G * otherType.mass / (distanceSquared + 1e-6);
                    force -= normalizeVector(direction) * gravityMagnitude;
                }
                


            }

            workgroupBarrier(); // Synchronize before loading the next chunk
        }







        let size = f32(1600);

        // ##### Update the velocity and position of the particle #####
        me.velocity = (me.velocity + force) * 0.5;
        me.position += me.velocity;


        // ##### Bounding Box #####
        if(me.position.x > size || me.position.x < -1 * size) {
            me.velocity.x = me.velocity.x * -1;
            me.position.x += me.velocity.x;
        }
        if(me.position.y > size || me.position.y < -1 * size) {
            me.velocity.y = me.velocity.y * -1;
            me.position.y += me.velocity.y;
        }
        if(me.position.z > size || me.position.z < -1 * size) {
            me.velocity.z = me.velocity.z * -1;
            me.position.z += me.velocity.z;
        }

        particlesOut[index] = me;
        
    }
`