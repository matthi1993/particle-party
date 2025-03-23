export const vertexShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>,
        @location(3) selected: f32,
        @location(4) hovered: f32,
        @location(5) size: f32
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
        size: f32,       // 4 bytes
        _padding: f32,   // 4 bytes (to align the struct to 16 bytes)
    }

    struct Uniforms {
        viewProjectionMatrix: mat4x4<f32>,
        selectionCoordinates: vec4f
    }


    @group(0) @binding(0) var<storage> dataIn: array<Particle>;
    @group(0) @binding(1) var<storage> particleTypes: array<ParticleType>;
    @group(0) @binding(2)  var<uniform> uniforms: Uniforms;

    @vertex
    fn vertexMain(
        @location(0) position: vec2f, 
        @builtin(instance_index) instance: u32
    ) -> VertexOutput {

        let myType = particleTypes[i32(dataIn[instance].particleAttributes.x)];
        
        var output: VertexOutput;

        let modelViewProjection = uniforms.viewProjectionMatrix;
        output.position = modelViewProjection * dataIn[instance].position + vec4f(position * 4, 0, 0) ;
        output.color = myType.color;
        output.uv = position * 0.5 + 0.5;
        output.size = 0.5 * myType.size;


        // Check what circles are in selection
        let clickDist = length(uniforms.selectionCoordinates - dataIn[instance].position);
        if(clickDist < 5) {
            output.hovered = 1;
        }

        return output;
    }
`;