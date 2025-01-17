
import { GpuContext } from './gpu.context';
import { Square } from './utils'

export interface ShapeInstances {
    shape: Square,
    instances: number
}

export class Render {

    private renderPipeline?: any;
    private bindGroups?: any;

    private shape: Square; // TODO think of refactoring this
    private instances: number;

    constructor(
        gpuContext: GpuContext,
        pipelineLayout: any,
        bindGroups: any,
        vertexShaderSource: any,
        fragmentShaderSource: any,
        shape: Square,
        instances: number
    ) {
        this.bindGroups = bindGroups;
        this.shape = shape;
        this.instances = instances;

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

    execute(encoder: any, step: number, view: any) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: view,
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
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