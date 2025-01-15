export const vertexShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) cell: vec2f,
    };

    struct Particle {
        position: vec4f,
        velocity: vec4f,
        particleAttributes: vec4f
    }

    @group(0) @binding(0) var<storage> dataIn: array<Particle>;
    @group(0) @binding(1) var<storage, read_write> dataOut: array<Particle>;

    @vertex
    fn vertexMain(
        @location(0) position: vec2f, 
        @builtin(instance_index) instance: u32
    ) -> VertexOutput {
        
        var output: VertexOutput;

        var size = f32(2);
        var distance = f32(350);

        output.position = vec4f(position, 0, 0) * size + dataIn[instance].position + vec4f(0,0,0,distance);
        output.cell = vec2f(dataIn[instance].particleAttributes.x, 0);

        return output;
    }
`;