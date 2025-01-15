import { Component, OnInit, OnDestroy } from '@angular/core';

import { Square, create, createArraysFromPoints } from './shapes';
import { vertexShaderSource } from './shader/vertexShader';
import { fragmentShaderSource } from './shader/fragmentShader';
import { WORKGROUP_SIZE, computeShader } from './shader/computeShader'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'default';

  private canvas?: HTMLCanvasElement;
  private context?: any;
  private canvasFormat?: any;
  private device?: any;

  private UPDATE_INTERVAL = 50;
  private step = 0;

  private simulationPipeline?: any;
  private renderPipeline?: any;
  private bindGroups?: any;
  private numWorkgroups?: any;
  private squreVertex?: any;

  private points?: any;

  private renderIntervalId: any;

  async ngOnInit() {
    if (!window.navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.canvas = document.querySelector("canvas")!!;
    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu");
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context!!.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    // Example: Create a simple render pipeline here
    console.log('WebGPU initialized.');

    
    this.squreVertex = new Square(this.device);

    this.points = create(2000, 0)
      .concat(create(2000, 1))
      .concat(create(2000, 2))
      .concat(create(2000, 3));

    console.log(this.points);

    let positionArray = createArraysFromPoints(this.points);

    const positionsStorage = [
      this.device.createBuffer({
        label: "Positions A",
        size: positionArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
      this.device.createBuffer({
        label: "Positions B",
        size: positionArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
    ];
    this.device.queue.writeBuffer(positionsStorage[0], 0, positionArray);

    // Create the bind group layout and pipeline layout.
    const bindGroupLayout = this.device.createBindGroupLayout({
      label: "Cell Bind Group Layout",
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" } // Position in buffer
      }, {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" } // Position out buffer
      }]
    });

    const pipelineLayout = this.device.createPipelineLayout({
      label: "Cell Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });


    // Create a pipeline that renders the cell.
    this.renderPipeline = this.device.createRenderPipeline({
      label: "Cell pipeline",
      layout: pipelineLayout,
      vertex: {
        module: this.device.createShaderModule({
          code: vertexShaderSource,
        }),
        entryPoint: "vertexMain",
        buffers: [this.squreVertex.vertexBufferLayout]
      },
      fragment: {
        module: this.device.createShaderModule({
          code: fragmentShaderSource,
        }),
        entryPoint: "fragmentMain",
        targets: [{
          format: this.canvasFormat
        }]
      }
    });

    // Create the compute shader that will process the game of life simulation.
    const simulationShaderModule = this.device.createShaderModule({
      label: "Life simulation shader",
      code: computeShader
    });

    // Create a compute pipeline that updates the game state.
    this.simulationPipeline = this.device.createComputePipeline({
      label: "Simulation pipeline",
      layout: pipelineLayout,
      compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
      }
    });


    // Create a bind group to pass the grid uniforms into the pipeline
    this.bindGroups = [
      this.device.createBindGroup({
        label: "Cell renderer bind group A",
        layout: bindGroupLayout,
        entries: [{
          binding: 0,
          resource: { buffer: positionsStorage[0] }
        }, {
          binding: 1,
          resource: { buffer: positionsStorage[1] }
        }],
      }),
      this.device.createBindGroup({
        label: "Cell renderer bind group B",
        layout: bindGroupLayout,
        entries: [{
          binding: 0,
          resource: { buffer: positionsStorage[1] }
        }, {
          binding: 1,
          resource: { buffer: positionsStorage[0] }
        }],
      }),
    ];

    this.numWorkgroups = Math.ceil(this.points.length / WORKGROUP_SIZE);

    this.startRenderLoop();
  }

  startRenderLoop() {
    this.renderIntervalId = setInterval(() => {
      this.render();
    }, 50);
  }

  ngOnDestroy() {
    // Clear the interval to prevent memory leaks
    if (this.renderIntervalId) {
      clearInterval(this.renderIntervalId);
    }
  }

  render() {
    if (!this.device || !this.context) {
      return;
    }

    const encoder = this.device.createCommandEncoder();

    // Start a compute pass
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(this.simulationPipeline);
    computePass.setBindGroup(0, this.bindGroups[this.step % 2]);
    computePass.dispatchWorkgroups(this.numWorkgroups);
    computePass.end();
    // compute ended


    this.step++; // Increment the step count


    // Start a render pass
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: this.context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
            storeOp: "store",
        }]
    });

    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.bindGroups[this.step % 2]);
    pass.setVertexBuffer(0, this.squreVertex.vertexBuffer);
    pass.draw(
        this.squreVertex.vertices.length / 2, // number of vertices
        this.points.length, // number of instances
    );
    pass.end();
    // render ended


    this.device.queue.submit([encoder.finish()]);
}
}

