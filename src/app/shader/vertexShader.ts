export const vertexShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
    };

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

    @group(0) @binding(0) var<storage> dataIn: array<Particle>;
    @group(0) @binding(1) var<storage, read_write> dataOut: array<Particle>;

    @group(0) @binding(2) var<storage> particleTypes: array<ParticleType>;

    @vertex
    fn vertexMain(
        @location(0) position: vec2f, 
        @builtin(instance_index) instance: u32
    ) -> VertexOutput {

        let myType = particleTypes[i32(dataIn[instance].particleAttributes.x)];
        
        var output: VertexOutput;

        var size = f32(2);
        var distance = f32(350);

        output.position = vec4f(position, 0, 0) * size + dataIn[instance].position + vec4f(0,0,0,distance);
        output.color = myType.color;

        return output;
    }
`;