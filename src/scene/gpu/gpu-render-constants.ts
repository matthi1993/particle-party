export const BACKGROUND_COLOR = {r: 0.041, g: 0.057, b: 0.084, a: 0.0};

export const BIND_GROUP_LAYOUT = {
    label: "Cell Bind Group Layout",
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" } // position in buffer
    }, {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" } // types buffer
    }, {
        binding: 2,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" } // types buffer
    }, {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "storage" } // selection buffer
    }
    ]
};

export const FORMAT_SHADER_LAYOUT = {
    format: "bgra8unorm",
    blend: {
        color: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
        },
        alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
        },
    },
};