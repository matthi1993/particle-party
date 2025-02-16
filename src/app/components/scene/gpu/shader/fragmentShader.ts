export const fragmentShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
    };

    @fragment
    fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
        return input.color;
    }
`;