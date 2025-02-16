export const fragmentShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>
    };

    @fragment
    fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {

        let center = vec2<f32>(0.5, 0.5);  // Center of the square (in UV space)
        let radius = 0.45;                  // Circle radius (relative to UV space, where 1 is the full size of the square)
        let softness = 0.05;               // Softness of the edge (lower value = sharper edge, higher value = smoother edge)

        // Calculate the distance from the center
        let dist = distance(input.uv, center);

        // Apply a smooth step for soft edges
        let alpha = smoothstep(radius - softness, radius + softness, dist);

        return vec4f(input.color.xyz, 1.0 - alpha);
    }
`;