
import { GpuContext } from './gpu.context';
import { sceneRenderShader } from './shader/sceneRenderShader';
import { Shape } from './shapes/shapes';
import {BIND_GROUP_LAYOUT, FORMAT_SHADER_LAYOUT} from "./gpu-render-constants";

export interface ShapeInstances {
    shape: Shape,
    instances: number
}

export class Render {

    private renderPipeline?: any;
    private bindGroups?: any;
    private bindGroupLayout?: any;

    private shape: Shape;

    constructor(
        gpuContext: GpuContext,
        shape: Shape
    ) {
        this.shape = shape;

        this.bindGroupLayout = gpuContext.device.createBindGroupLayout(BIND_GROUP_LAYOUT);
        const pipelineLayout = gpuContext.device.createPipelineLayout({
            label: "Cell Pipeline Layout",
            bindGroupLayouts: [this.bindGroupLayout],
        });
        let shaderModule = gpuContext.device.createShaderModule({
            code: sceneRenderShader,
        });
        this.renderPipeline = gpuContext.device.createRenderPipeline({
            label: "Cell pipeline",
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: [this.shape.vertexBufferLayout]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [FORMAT_SHADER_LAYOUT]
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

    execute(renderPass: any, step: number, instances: number) {
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroups[step % 2]);

        renderPass.setVertexBuffer(0, this.shape.vertexBuffer);
        renderPass.draw(
            this.shape.vertices.length / 2, // number of vertices
            instances, // number of instances
        );
    }
}