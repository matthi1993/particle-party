export const fragmentShaderSource = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) cell: vec2f,
    };

    @fragment
    fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
        var color = vec4f(1, 1, 1, 1);

        if(input.cell.x == 3) {
            color = vec4f(0, 1, 0, 1);
        }
        if(input.cell.x == 2) {
            color = vec4f(0.5, 0.5, 1, 1);
        }
        if(input.cell.x == 1) {
            color = vec4f(1, 0, 0, 1);
        } 
        if(input.cell.x == 0) {
            color = vec4f(1, 1, 0, 1);
        }

        return color;
    }
`;