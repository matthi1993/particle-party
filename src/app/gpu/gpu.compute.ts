
import { WORKGROUP_SIZE } from '../shader/computeShader'

export class Compute {

    BIND_GROUP_LAYOUT = {
        label: "Compute Bind Group Layout",
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" } // position in buffer
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" } // position out buffer
        }, {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" } // types buffer
        }, {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" }
        }
        ]
    };

    private simulationPipeline?: any;
    private bindGroups?: any;
    private bindGroupLayout?: any;

    constructor(
        device: any,
        elementCount: number,
        computeShader: any
    ) {

        this.bindGroupLayout = device.createBindGroupLayout(this.BIND_GROUP_LAYOUT);
        const pipelineLayout = device.createPipelineLayout({
            label: "Cell Pipeline Layout",
            bindGroupLayouts: [this.bindGroupLayout],
        });

        // Create the compute shader that will process the game of life simulation.
        const simulationShaderModule = device.createShaderModule({
            label: "Life simulation shader Compute",
            code: computeShader
        });

        this.simulationPipeline = device.createComputePipeline({
            label: "Simulation pipeline Compute",
            layout: pipelineLayout,
            compute: {
                module: simulationShaderModule,
                entryPoint: "computeMain",
            }
        });
    }

    updateBindGroups(device: any, positionsStorage: any, typesStorage: any, forcesStorage: any) {
        const bindGroups = [
            device.createBindGroup({
                label: "Compute bind group A",
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: positionsStorage[0] }
                }, {
                    binding: 1,
                    resource: { buffer: positionsStorage[1] }
                }, {
                    binding: 2,
                    resource: { buffer: typesStorage }
                }, {
                    binding: 3,
                    resource: { buffer: forcesStorage }
                }],
            }),
            device.createBindGroup({
                label: "Compute bind group B",
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: positionsStorage[1] }
                }, {
                    binding: 1,
                    resource: { buffer: positionsStorage[0] }
                }, {
                    binding: 2,
                    resource: { buffer: typesStorage }
                }, {
                    binding: 3,
                    resource: { buffer: forcesStorage }
                }],
            }),
        ];

        this.bindGroups = bindGroups;
    }

    execute(encoder: any, step: number, elements: number) {
        const computePass = encoder.beginComputePass();

        computePass.setPipeline(this.simulationPipeline);
        computePass.setBindGroup(0, this.bindGroups[step % 2]);
        computePass.dispatchWorkgroups(Math.ceil(elements / WORKGROUP_SIZE));

        computePass.end();
    }
}