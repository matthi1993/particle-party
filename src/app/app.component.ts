import { Component, OnInit, OnDestroy } from '@angular/core';

import { Square, createArraysFromPoints, createForcesArray, createTypesArray } from './utils';
import { vertexShaderSource } from './shader/vertexShader';
import { fragmentShaderSource } from './shader/fragmentShader';
import { computeShader } from './shader/computeShader'
import { Compute } from './gpu.compute'
import { Render } from './gpu.render'
import { GpuContext } from './gpu.context'

import { ControlsComponent, SimulationData } from './components/controls/controls.component';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    ControlsComponent
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'default';


  private gpuContext: GpuContext = new GpuContext();
  private simulationCompute?: Compute;
  private simulationRenderer?: Render;

  private UPDATE_INTERVAL = 50;
  private step = 0;

  private renderIntervalId: any;

  public simulationData: SimulationData = new SimulationData();

  async ngOnInit() {
    await this.gpuContext.setup();
    this.updateData();
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

  public onDataChange(data: SimulationData) {
    this.simulationData = data;
    this.updateData();
  }

  public updateData() {
    this.step = 0;
    console.log(this.simulationData);
    let positionArray = createArraysFromPoints(this.simulationData.points);

    const positionsStorage = [
      this.gpuContext.createStorageBuffer("Positions In", positionArray.byteLength),
      this.gpuContext.createStorageBuffer("Positions Out", positionArray.byteLength)
    ];
    this.gpuContext.device.queue.writeBuffer(positionsStorage[0], 0, positionArray);

    let typesArray = createTypesArray(this.simulationData.types);
    const typesStorage = this.gpuContext.createStorageBuffer("Types", typesArray.byteLength);
    this.gpuContext.device.queue.writeBuffer(typesStorage, 0, typesArray);

    let forcesArray = createForcesArray(this.simulationData.forces);
    const forcesStorage = this.gpuContext.createStorageBuffer("Forces", forcesArray.byteLength);
    this.gpuContext.device.queue.writeBuffer(forcesStorage, 0, forcesArray);
    console.log(forcesArray);

    // create the bind group layout and pipeline layout.
    const bindGroupLayout = this.gpuContext.device.createBindGroupLayout({
      label: "Cell Bind Group Layout",
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
        buffer: { type: "read-only-storage" } // types buffer
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
        }, {
          binding: 2,
          resource: { buffer: typesStorage }
        }, {
          binding: 3,
          resource: { buffer: forcesStorage }
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
        }, {
          binding: 2,
          resource: { buffer: typesStorage }
        }, {
          binding: 3,
          resource: { buffer: forcesStorage }
        }],
      }),
    ];


    this.simulationCompute = new Compute(
      this.gpuContext.device,
      pipelineLayout,
      bindGroups,
      this.simulationData.points.length,
      computeShader
    )

    this.simulationRenderer = new Render(
      this.gpuContext,
      pipelineLayout,
      bindGroups,
      vertexShaderSource,
      fragmentShaderSource,
      new Square(this.gpuContext.device),
      this.simulationData.points.length
    )
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

