
import { WORKGROUP_SIZE } from './shader/computeShader'

export class Compute {

    private simulationPipeline?: any;
    private bindGroups?: any;
    private numWorkgroups?: any;

    constructor(
        device: any,
        pipelineLayout: any,
        bindGroups: any,
        elementCount: number,
        computeShader: any
    ) {
        this.bindGroups = bindGroups;
        this.numWorkgroups = Math.ceil(elementCount / WORKGROUP_SIZE);

        // Create the compute shader that will process the game of life simulation.
        const simulationShaderModule = device.createShaderModule({
            label: "Life simulation shader",
            code: computeShader
        });

        this.simulationPipeline = device.createComputePipeline({
            label: "Simulation pipeline",
            layout: pipelineLayout,
            compute: {
                module: simulationShaderModule,
                entryPoint: "computeMain",
            }
        });
    }


    execute(encoder: any, step: number) {
        const computePass = encoder.beginComputePass();

        computePass.setPipeline(this.simulationPipeline);
        computePass.setBindGroup(0, this.bindGroups[step % 2]);
        computePass.dispatchWorkgroups(this.numWorkgroups);

        computePass.end();
    }
}