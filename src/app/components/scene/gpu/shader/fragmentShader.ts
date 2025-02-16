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

        let center = vec2<f32>(0.5, 0.5);  // Center of the square (in UV space)
        let radius = 0.45;                  // Circle radius (relative to UV space, where 1 is the full size of the square)
        let softness = 0.05;               // Softness of the edge (lower value = sharper edge, higher value = smoother edge)

        // Calculate the distance from the center
        let dist = distance(input.uv, center);

        // Apply a smooth step for soft edges
        let alpha = smoothstep(radius - softness, radius, dist);



        // Draw a red Border around selected ones
        if(input.selected == 1) {
            if(dist > 0.2 && dist < radius) {
                return vec4f(1,0,0,1);
            }
        }
        return vec4f(input.color.xyz, 1.0 - alpha);
    }
`;