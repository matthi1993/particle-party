export const sceneRenderShader = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>,
        @location(3) selected: f32,
        @location(4) hovered: f32,
        @location(5) size: f32,
        @location(6) velocity: vec4f
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
        selectionCoordinates: vec2f,
        selectionRadius: f32,
        _padding: f32,
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
        output.velocity = modelViewProjection * dataIn[instance].velocity;
        output.color = myType.color;
        output.uv = position * 0.5 + 0.5;
        output.size = 0.5 * myType.size;


        // Check what circles are in selection
        let clickDist = length(uniforms.selectionCoordinates - dataIn[instance].position.xy);
        if(clickDist < uniforms.selectionRadius) {
            output.hovered = 1;
        }
        output.selected = dataIn[instance].particleAttributes.z;

        return output;
    }
    
    @fragment
    fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {

        let center = vec2<f32>(0.5, 0.5);
        let size = 0.25 * input.size;
        let softness = 0.01;

        let dist = distance(input.uv, center);
        let circle = smoothstep(size - softness, size, dist);


        // Draw a red Border around selected ones
        
        if(dist > (size - 0.1) && dist < size) {
            if(input.hovered == 1) {
                return vec4f(1,1,0,1);
            }
            if(input.selected == 1) {
                return vec4f(1,0,0,1);
            }
        }
            
        if(dist < size) {
            return vec4f(input.color.xyz, 1 - circle);
        }
            

        let fade = smoothstep(-2, 0.5, dist);
        // Glow
        return vec4f(input.color.xyz * 2, 1 - fade);
    }
`;