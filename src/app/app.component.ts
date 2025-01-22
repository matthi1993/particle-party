import { Component, OnInit, OnDestroy } from '@angular/core';

import { Square, createArraysFromPoints, createForcesArray, createTypesArray } from './utils';
import { vertexShaderSource } from './shader/vertexShader';
import { fragmentShaderSource } from './shader/fragmentShader';
import { computeShader } from './shader/computeShader'
import { Compute } from './gpu.compute'
import { Render } from './gpu.render'
import { GpuContext } from './gpu.context'

import { ControlsComponent } from './components/controls/controls.component';
import { SimulationData } from './model/Simulation';
import { createDefaultSimulationModel } from './model/DefaultSimulationData';
import { Camera } from './model/Camera';



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

  private forcesStorage?: any;
  private typesStorage?: any;
  private viewProjectionBuffer?: any;

  private UPDATE_INTERVAL = 75;
  private step = 0;

  private renderIntervalId: any;

  public simulationData: SimulationData = createDefaultSimulationModel();
  private camera?: Camera;

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

  public onDataChange() {
    this.updateData();
  }

  public onForcesChange() {
    let forcesArray = createForcesArray(this.simulationData.forceByType);
    this.gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);

    let typesArray = createTypesArray(this.simulationData.forceByType);
    this.gpuContext.device.queue.writeBuffer(this.typesStorage, 0, typesArray);
  }

  public updateData() {
    this.step = 0;
    let positionArray = createArraysFromPoints(this.simulationData.points);

    const positionsStorage = [
      this.gpuContext.createStorageBuffer("Positions In", positionArray.byteLength),
      this.gpuContext.createStorageBuffer("Positions Out", positionArray.byteLength)
    ];
    this.gpuContext.device.queue.writeBuffer(positionsStorage[0], 0, positionArray);

    let typesArray = createTypesArray(this.simulationData.forceByType);
    this.typesStorage = this.gpuContext.createStorageBuffer("Types", typesArray.byteLength);
    this.gpuContext.device.queue.writeBuffer(this.typesStorage, 0, typesArray);

    let forcesArray = createForcesArray(this.simulationData.forceByType);
    this.forcesStorage = this.gpuContext.createStorageBuffer("Forces", forcesArray.byteLength);
    this.gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);

    // CAMERA STUFF #######################
    this.camera = new Camera(this.gpuContext.canvas!!.width, this.gpuContext.canvas!!.height);

    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    this.gpuContext.canvas!!.addEventListener("mousedown", (e: MouseEvent) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    this.gpuContext.canvas!!.addEventListener("mousemove", (e: MouseEvent) => {
      if (isMouseDown) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Update the last mouse position
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        this.camera!!.cameraAngle += deltaX / 100;
      }
    });
    this.gpuContext.canvas!!.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    this.viewProjectionBuffer = this.gpuContext.device.createBuffer({
      size: 64, // 4x4 matrix of 4-byte floats
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Write the matrix to the buffer
    this.gpuContext.device.queue.writeBuffer(
      this.viewProjectionBuffer,
      0,
      new Float32Array(this.camera.getViewProjectionMatrix())
    );
    // #######################


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
      }, {
        binding: 4,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" } // types buffer
      }
      ]
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
          resource: { buffer: this.typesStorage }
        }, {
          binding: 3,
          resource: { buffer: this.forcesStorage }
        }, {
          binding: 4,
          resource: {
            buffer: this.viewProjectionBuffer,
          },
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
          resource: { buffer: this.typesStorage }
        }, {
          binding: 3,
          resource: { buffer: this.forcesStorage }
        }, {
          binding: 4,
          resource: {
            buffer: this.viewProjectionBuffer,
          },
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
    if (!this.gpuContext.device || !this.gpuContext.context || !this.camera) {
      return;
    }

    this.camera.updateCamera();
    this.gpuContext.device.queue.writeBuffer(this.viewProjectionBuffer, 0, new Float32Array(this.camera.getViewProjectionMatrix()));

    const encoder = this.gpuContext.device.createCommandEncoder();

    this.simulationCompute?.execute(encoder, this.step);
    this.step++; //TODO don't use this for render
    this.simulationRenderer?.execute(encoder, this.step, this.gpuContext.context.getCurrentTexture().createView());

    this.gpuContext.device.queue.submit([encoder.finish()]);
  }
}

