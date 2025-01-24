
import { GpuContext } from './gpu.context';
import { vertexShaderSource } from '../shader/vertexShader';
import { fragmentShaderSource } from '../shader/fragmentShader';
import { Square } from '../utils'

export interface ShapeInstances {
    shape: Square,
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
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" } // types buffer
        }, {
            binding: 4,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: "uniform" } // types buffer
        }
        ]
    }

    private renderPipeline?: any;
    private bindGroups?: any;
    private bindGroupLayout?: any;

    private shape: Square; // TODO think of refactoring this
    private instances: number;

    constructor(
        gpuContext: GpuContext,
        shape: Square,
        instances: number
    ) {
        this.shape = shape;
        this.instances = instances;

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
                                srcFactor: "one", // Keep the alpha channel as is
                                dstFactor: "zero", // Ignore destination alpha
                                operation: "add",
                            },
                        },
                    },
                ]
            }
        });

    }

    updateBindGroups(device: any, positionsStorage: any, typesStorage: any, forcesStorage: any, viewProjectionBuffer: any) {
        this.bindGroups = [
            device.createBindGroup({
                label: "Cell renderer bind group A",
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: positionsStorage[0] }
                }, {
                    binding: 2,
                    resource: { buffer: typesStorage }
                }, {
                    binding: 4,
                    resource: {
                        buffer: viewProjectionBuffer,
                    },
                }],
            }),
            device.createBindGroup({
                label: "Cell renderer bind group B",
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: positionsStorage[1] }
                }, {
                    binding: 2,
                    resource: { buffer: typesStorage }
                }, {
                    binding: 4,
                    resource: {
                        buffer: viewProjectionBuffer,
                    },
                }],
            }),
        ];
    }

    execute(encoder: any, step: number, view: any) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: view,
                loadOp: "clear",
                clearValue: { r: 0.141, g: 0.157, b: 0.184, a: 1.0 },
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.renderPipeline);
        pass.setBindGroup(0, this.bindGroups[step % 2]);

        pass.setVertexBuffer(0, this.shape.vertexBuffer);
        pass.draw(
            this.shape.vertices.length / 2, // number of vertices
            this.instances, // number of instances
        );

        pass.end();
    }
}