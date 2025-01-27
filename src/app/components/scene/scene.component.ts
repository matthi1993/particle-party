import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { PhysicsData } from '../../model/Simulation';
import { Square, createArraysFromPoints, createForcesArray, createTypesArray } from '../../utils';
import { computeShader } from '../../shader/computeShader'
import { Compute } from '../../gpu/gpu.compute'
import { Render } from '../../gpu/gpu.render'
import { GpuContext } from '../../gpu/gpu.context'

import { Camera } from '../../model/Camera';
import { Point } from 'src/app/model/Point';

@Component({
  selector: 'app-scene',
  imports: [],
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
})
export class SceneComponent implements OnInit, OnDestroy {

  @Input() public physicsData!: PhysicsData;
  @Input() public points!: Point[];
  @Input() public canvasWidth = 300;
  @Input() public canvasHeight = 300;
  @Input() public camera: Camera = new Camera(this.canvasWidth, this.canvasHeight, 15);

  private gpuContext: GpuContext = new GpuContext();
  private simulationCompute?: Compute;
  private simulationRenderer?: Render;

  private forcesStorage?: any;
  private typesStorage?: any;
  private viewProjectionBuffer?: any;

  private step = 0;
  public isPlaying = false;
  private RENDER_UPDATE_INTERVAL = 50;
  private SIMULATION_UPDATE_INTERVAL = 25;

  private simulateIntervalId: any = undefined;
  private renderIntervalId: any = undefined;


  async ngOnInit() {
    await this.gpuContext.setup().then(() => {
      this.setupCamera();
      this.addCameraListeners(this.gpuContext.canvas!!);

      this.recreateScene();
      this.startRenderLoop();
      this.simulationLoop(true);
    });
  }

  public simulationLoop(shouldPlay: boolean) {
    this.isPlaying = shouldPlay;
    console.log(this.isPlaying);
    if(shouldPlay && !this.simulateIntervalId) {
      this.simulateIntervalId = setInterval(() => {
        this.simulate();
      }, this.SIMULATION_UPDATE_INTERVAL);
    } else if(this.simulateIntervalId){
      clearInterval(this.simulateIntervalId);
      this.simulateIntervalId = undefined;
    }
  }

  startRenderLoop() {
    this.renderIntervalId = setInterval(() => {
      this.render();
    }, this.RENDER_UPDATE_INTERVAL);
  }

  ngOnDestroy() {
    if(this.renderIntervalId){
      clearInterval(this.renderIntervalId);
    }
    if(this.simulateIntervalId){
      clearInterval(this.simulateIntervalId);
    }
  }

  setupCamera() {
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
  }

  addCameraListeners(element: HTMLElement) {
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    element.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0 && this.camera.cameraRadius <= 5) {
        this.camera.cameraRadius = 5;
      } else {
        this.camera.cameraRadius += event.deltaY / 30;
      }
    });

    element.addEventListener("mousedown", (e: MouseEvent) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    element.addEventListener("mousemove", (e: MouseEvent) => {
      if (isMouseDown) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Update the last mouse position
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        this.camera!!.cameraAngle += deltaX / 100;
      }
    });
    element.addEventListener("mouseup", () => {
      isMouseDown = false;
    });
  }

  public updateForcesAndTypes() {
    let forcesArray = createForcesArray(this.physicsData.forces);
    this.gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);

    let typesArray = createTypesArray(this.physicsData.types);
    this.gpuContext.device.queue.writeBuffer(this.typesStorage, 0, typesArray);
  }

  public recreateScene() {
    this.step = 0;
    let positionArray = createArraysFromPoints(this.points);

    const positionsStorage = [
      this.gpuContext.createStorageBuffer("Positions In", positionArray.byteLength),
      this.gpuContext.createStorageBuffer("Positions Out", positionArray.byteLength)
    ];
    this.gpuContext.device.queue.writeBuffer(positionsStorage[0], 0, positionArray);

    let typesArray = createTypesArray(this.physicsData.types);
    this.typesStorage = this.gpuContext.createStorageBuffer("Types", typesArray.byteLength);
    this.gpuContext.device.queue.writeBuffer(this.typesStorage, 0, typesArray);

    let forcesArray = createForcesArray(this.physicsData.forces);
    this.forcesStorage = this.gpuContext.createStorageBuffer("Forces", forcesArray.byteLength);
    this.gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);

    this.simulationCompute = new Compute(
      this.gpuContext.device,
      this.points.length,
      computeShader
    )
    this.simulationCompute.updateBindGroups(this.gpuContext.device, positionsStorage, this.typesStorage, this.forcesStorage);

    this.simulationRenderer = new Render(
      this.gpuContext,
      new Square(this.gpuContext.device),
      this.points.length
    )
    this.simulationRenderer.updateBindGroups(this.gpuContext.device, positionsStorage, this.typesStorage, this.forcesStorage, this.viewProjectionBuffer)
  }

  render() {
    this.camera.updateCamera();
    this.gpuContext.device.queue.writeBuffer(this.viewProjectionBuffer, 0, new Float32Array(this.camera.getViewProjectionMatrix()));

    const encoder = this.gpuContext.device.createCommandEncoder();

    this.simulationRenderer?.execute(encoder, this.step, this.gpuContext.context.getCurrentTexture().createView());

    this.gpuContext.device.queue.submit([encoder.finish()]);
  }

  simulate() {
    const encoder = this.gpuContext.device.createCommandEncoder();

    this.simulationCompute?.execute(encoder, this.step);
    this.step++;

    this.gpuContext.device.queue.submit([encoder.finish()]);
  }
}
