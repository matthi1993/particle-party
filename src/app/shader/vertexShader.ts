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

    struct Uniforms {
        viewProjectionMatrix: mat4x4<f32>
    }


    @group(0) @binding(0) var<storage> dataIn: array<Particle>;
    @group(0) @binding(2) var<storage> particleTypes: array<ParticleType>;
    @group(0) @binding(4)  var<uniform> uniforms: Uniforms;

    @vertex
    fn vertexMain(
        @location(0) position: vec2f, 
        @builtin(instance_index) instance: u32
    ) -> VertexOutput {

        let myType = particleTypes[i32(dataIn[instance].particleAttributes.x)];
        
        var output: VertexOutput;

        var size = f32(5);
        var offset = vec4f(0,0,0,50);

        let modelViewProjection = uniforms.viewProjectionMatrix;
        let localPosition =  offset + dataIn[instance].position;
        output.position = modelViewProjection * localPosition + vec4f(position * size, 0, 0) ;
        output.color = myType.color;

        return output;
    }
`;