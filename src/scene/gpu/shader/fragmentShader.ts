export const fragmentShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>,
        @location(3) selected: f32,
        @location(4) hovered: f32,
        @location(5) size: f32
    };

    struct Uniforms {
        viewProjectionMatrix: mat4x4<f32>,
        selectionCoordinates: vec4f
    }

    @group(0) @binding(2)  var<uniform> uniforms: Uniforms;
    @group(0) @binding(3) var<storage, read_write> selectedCircles: array<u32>;
    

    @fragment
    fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {

        let center = vec2<f32>(0.5, 0.5);
        let size = 0.25 * input.size;
        let softness = 0.01;

        let dist = distance(input.uv, center);
        let circle = smoothstep(size - softness, size, dist);


        // Draw a red Border around selected ones
        
        if(dist > (size - 0.3) && dist < size) {
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