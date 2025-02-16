export const fragmentShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>,
        @location(3) id: f32
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
        let alpha = smoothstep(radius - softness, radius + softness, dist);

        let clickDist = length(uniforms.selectionCoordinates - input.position);
        

        // Check if inside circle
        var selected = u32(0);
        if (clickDist < 50) {
            selected = 1;
        } else {
            selected = 0;
        }

        selectedCircles[u32(input.id)] = selected;

        if(selected == 1) {
            return vec4f(1, 0, 0, 1.0 - alpha);
        }
        return vec4f(input.color.xyz, 1.0 - alpha);
    }
`;