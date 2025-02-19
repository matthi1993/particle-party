export const fragmentShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>,
        @location(3) selected: f32
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
        let size = 0.04;
        let softness = 0.001;

        let dist = distance(input.uv, center);



        // Draw a red Border around selected ones
        if(input.selected == 1) {
            if(dist > 0.2 && dist < size) {
                return vec4f(1,0,0,1);
            }
        }
        if(dist < size) {
            var alpha = smoothstep(size - softness, size, dist);
            return vec4f(input.color.xyz, 1.0 - alpha);
        }

        // Glow
        var alpha = smoothstep(0, 1, dist);
        return vec4f(input.color.xyz * 10, 0.03 - alpha);
    }
`;