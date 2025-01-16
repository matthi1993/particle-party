import { Component, OnInit, OnDestroy } from '@angular/core';

import { Square, create, createArraysFromPoints } from './utils';
import { vertexShaderSource } from './shader/vertexShader';
import { fragmentShaderSource } from './shader/fragmentShader';
import { computeShader } from './shader/computeShader'
import { Compute } from './gpu.compute'
import { Render } from './gpu.render'
import { GpuContext } from './gpu.context'



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'default';

  private gpuContext: GpuContext = new GpuContext();
  private simulationCompute?: Compute;
  private simulationRenderer?: Render;

  private UPDATE_INTERVAL = 50;
  private step = 0;

  private renderIntervalId: any;

  async ngOnInit() {
    await this.gpuContext.setup();

    const points = create(1000, 0)
      .concat(create(3000, 1))
      .concat(create(2000, 2))
      .concat(create(3000, 3));


    let positionArray = createArraysFromPoints(points);

    const positionsStorage = [
      this.gpuContext.createStorageBuffer("Positions In", positionArray.byteLength),
      this.gpuContext.createStorageBuffer("Positions Out", positionArray.byteLength)
    ];
    this.gpuContext.device.queue.writeBuffer(positionsStorage[0], 0, positionArray);

    // Create the bind group layout and pipeline layout.
    const bindGroupLayout = this.gpuContext.device.createBindGroupLayout({
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

    const pipelineLayout = this.gpuContext.device.createPipelineLayout({
      label: "Cell Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    // Create a bind group to pass the grid uniforms into the pipeline
    const bindGroups = [
      this.gpuContext.device.createBindGroup({
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
      this.gpuContext.device.createBindGroup({
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


    this.simulationCompute = new Compute(
      this.gpuContext.device,
      pipelineLayout,
      bindGroups,
      points.length,
      computeShader
    )

    this.simulationRenderer = new Render(
      this.gpuContext,
      pipelineLayout,
      bindGroups,
        vertexShaderSource,
        fragmentShaderSource,
        new Square(this.gpuContext.device),
        points.length
    )

    this.startRenderLoop();
  }

  startRenderLoop() {
    this.renderIntervalId = setInterval(() => {
      this.render();
    }, this.UPDATE_INTERVAL);
  }

  ngOnDestroy() {
    if (this.renderIntervalId) {
      clearInterval(this.renderIntervalId);
    }
  }

  render() { // TODO seperate render and compute loop
    if (!this.gpuContext.device || !this.gpuContext.context) {
      return;
    }

    const encoder = this.gpuContext.device.createCommandEncoder();

    this.simulationCompute?.execute(encoder, this.step);
    this.step++; //TODO don't use this for render
    this.simulationRenderer?.execute(encoder, this.step, this.gpuContext.context.getCurrentTexture().createView());
    
    this.gpuContext.device.queue.submit([encoder.finish()]);
  }
}

