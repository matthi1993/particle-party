
import { GpuContext } from './gpu.context';
import { vertexShaderSource } from './shader/vertexShader';
import { fragmentShaderSource } from './shader/fragmentShader';
import { Shape } from './shapes/shapes';

export interface ShapeInstances {
    shape: Shape,
    instances: number
}

export class Render {

    BIND_GROUP_LAYOUT = {
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
    }

    private renderPipeline?: any;
    private bindGroups?: any;
    private bindGroupLayout?: any;

    private shape: Shape;

    constructor(
        gpuContext: GpuContext,
        shape: Shape
    ) {
        this.shape = shape;

        this.bindGroupLayout = gpuContext.device.createBindGroupLayout(this.BIND_GROUP_LAYOUT);
        const pipelineLayout = gpuContext.device.createPipelineLayout({
            label: "Cell Pipeline Layout",
            bindGroupLayouts: [this.bindGroupLayout],
        });

        // Create a pipeline that renders the cell.
        this.renderPipeline = gpuContext.device.createRenderPipeline({
            label: "Cell pipeline",
            layout: pipelineLayout,
            vertex: {
                module: gpuContext.device.createShaderModule({
                    code: vertexShaderSource,
                }),
                entryPoint: "vertexMain",
                buffers: [this.shape.vertexBufferLayout]
            },
            fragment: {
                module: gpuContext.device.createShaderModule({
                    code: fragmentShaderSource,
                }),
                entryPoint: "fragmentMain",
                targets: [
                    {
                        format: "bgra8unorm", // Color format
                        blend: {
                            color: {
                                srcFactor: "src-alpha", // Use source alpha
                                dstFactor: "one-minus-src-alpha", // Destination based on source alpha
                                operation: "add", // Add blended colors
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                        },
                    },
                ]
            }
        });

    }

    updateBindGroups(device: any, positionsStorage: any, typesStorage: any, uniformsBuffer: any, selectionOutBuffer: any) {
        this.bindGroups = [
            device.createBindGroup({
                label: "Cell renderer bind group A",
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: positionsStorage[0] }
                }, {
                    binding: 1,
                    resource: { buffer: typesStorage }
                }, {
                    binding: 2,
                    resource: { buffer: uniformsBuffer },
                }, {
                    binding: 3,
                    resource: { buffer: selectionOutBuffer },
                }],
            }),
            device.createBindGroup({
                label: "Cell renderer bind group B",
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: positionsStorage[1] }
                }, {
                    binding: 1,
                    resource: { buffer: typesStorage }
                }, {
                    binding: 2,
                    resource: { buffer: uniformsBuffer },
                }, {
                    binding: 3,
                    resource: { buffer: selectionOutBuffer },
                }],
            }),
        ];
    }

    execute(encoder: any, step: number, view: any, instances: number) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: view,
                loadOp: "clear",
                clearValue: { r: 0.141, g: 0.157, b: 0.184, a: 0.0 },
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.renderPipeline);
        pass.setBindGroup(0, this.bindGroups[step % 2]);

        pass.setVertexBuffer(0, this.shape.vertexBuffer);
        pass.draw(
            this.shape.vertices.length / 2, // number of vertices
            instances, // number of instances
        );
        pass.end();
    }
}