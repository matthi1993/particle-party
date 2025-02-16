import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { PhysicsData } from '../../model/Simulation';
import { computeShader } from './gpu/shader/computeShader'
import { Compute } from './gpu/gpu.compute'
import { Render } from './gpu/gpu.render'
import { GpuContext } from './gpu/gpu.context'

import { Camera } from '../../model/Camera';
import { Point } from 'src/app/model/Point';
import { SceneStorage } from './scene.gpu.storage';
import { vec4 } from 'gl-matrix';
import { MatIconModule } from '@angular/material/icon';
import { getMouseNDC, ndcToWorld, projectToScenePlane } from './scene.mousevent';
import { Shape } from './gpu/shapes/shapes';
import { OCTAGON } from './gpu/shapes/octagon';
import { SQUARE } from './gpu/shapes/square';

@Component({
  selector: 'app-scene',
  imports: [MatIconModule],
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
})
export class SceneComponent implements OnInit, OnDestroy {

  @Input() public physicsData!: PhysicsData;
  @Input() public points!: Point[];
  @Input() public canvasWidth: number = 900;
  @Input() public canvasHeight: number = 900;
  @Input() public camera: Camera = new Camera(
    this.canvasWidth,
    this.canvasHeight,
    200
  );
  public gpuContext: GpuContext = new GpuContext();
  private simulationCompute?: Compute;
  private simulationRenderer?: Render;
  private sceneStorage: SceneStorage = new SceneStorage();

  public step = 0;
  public isPlaying = false;
  private RENDER_UPDATE_INTERVAL = 30;
  private SIMULATION_UPDATE_INTERVAL = 15;
  private simulateIntervalId: any = undefined;
  private renderIntervalId: any = undefined;

  constructor() {
    this.gpuContext.setup().then(() => {

      this.gpuContext.canvas!.width = this.canvasWidth;
      this.gpuContext.canvas!.height = this.canvasHeight;

      this.sceneStorage.createComputeUniformBuffer(this.gpuContext)
      this.sceneStorage.createUniformBuffer(this.gpuContext, this.camera);
      this.addCameraListeners(this.gpuContext.canvas!!);

      this.createScene(this.points);
      this.startRenderLoop();
      this.simulationLoop(true);
    });
  }

  ngOnInit(): void {
  }

  public async simulationLoop(shouldPlay: boolean) {
    this.isPlaying = shouldPlay;

    if (shouldPlay && !this.simulateIntervalId) {
      this.simulateIntervalId = setInterval(() => {
        this.simulate();
      }, this.SIMULATION_UPDATE_INTERVAL);
    } else {
      if (this.simulateIntervalId) {
        clearInterval(this.simulateIntervalId);
      }
      this.simulateIntervalId = undefined;
      await this.updatePositionsFromCompute();
    }
  }

  startRenderLoop() {
    this.renderIntervalId = setInterval(() => {
      this.render();
    }, this.RENDER_UPDATE_INTERVAL);
  }

  ngOnDestroy() {
    if (this.renderIntervalId) {
      clearInterval(this.renderIntervalId);
    }
    if (this.simulateIntervalId) {
      clearInterval(this.simulateIntervalId);
    }
  }

  addPointsToScene(originX: number, originY: number, points: Point[]) {
    const worldPoint = ndcToWorld({ x: originX, y: originY }, this.camera);
    const scenePoint = projectToScenePlane(worldPoint, this.camera);

    let pointsToAdd: Point[] = [];
    points.forEach(point => {
      let newPosition = vec4.fromValues(0, 0, 0, 0);
      vec4.add(newPosition, point.position, vec4.fromValues(scenePoint[0], scenePoint[1], scenePoint[2], 1));
      pointsToAdd.push(new Point(
        newPosition,
        point.particleType
      ));
    })

    this.points.push(...pointsToAdd);
    this.createScene(this.points);
  }

  addCameraListeners(element: HTMLElement) {

    let isShiftDown = false;
    let isMouseDown = false;
    const moveSpeed = 0.1;
    let mousePosX = 0;
    let mousePosY = 0;

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') {
        isShiftDown = true;
      }
    });
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        isShiftDown = false;
      }
      if (event.code === 'Space') {
        this.simulationLoop(!this.isPlaying)
      }
    });
    document.addEventListener('mousedown', (event) => {
      isMouseDown = true;
    });
    document.addEventListener('mouseup', (event) => {
      isMouseDown = false;
    });

    element.addEventListener('mousemove', (event) => {
      event.preventDefault();

      //TODO move somewhere else???
      const ndc = getMouseNDC(event, element);
      const worldPoint = ndcToWorld(ndc, this.camera);
      const scenePoint = projectToScenePlane(worldPoint, this.camera);

      this.sceneStorage.updateComputeUniformsBuffer(
        this.gpuContext,
        vec4.fromValues(scenePoint[0], scenePoint[1], scenePoint[2], 1)
      )

      if (isMouseDown) {
        this.camera.position[0] -= (event.clientX - mousePosX) * moveSpeed * this.camera.position[2] * 0.01;
        this.camera.position[1] += (event.clientY - mousePosY) * moveSpeed * this.camera.position[2] * 0.01;

      }
      mousePosX = event.clientX;
      mousePosY = event.clientY;

    });

    element.addEventListener('wheel', (event) => {
      let minDistance = 5;
      event.preventDefault();
      if (event.deltaY < 0 && this.camera.position[2] <= minDistance) {
        this.camera.position[2] = minDistance;
      } else {
        let distanceFactor = (this.camera.position[2] + minDistance) * 0.025;
        this.camera.position[2] += event.deltaY / 30 * distanceFactor;
      }
    });
  }

  public updateForcesAndTypes() {
    this.sceneStorage.updateForceValues(this.gpuContext, this.physicsData);
    this.sceneStorage.updateTypeValues(this.gpuContext, this.physicsData);
  }

  public updateScene() {
    this.sceneStorage.updateForceValues(this.gpuContext, this.physicsData);
    this.sceneStorage.updateTypeValues(this.gpuContext, this.physicsData);
    this.sceneStorage.updatePointValues(this.gpuContext, this.points, this.physicsData);

    this.step = 0;
  }

  public createScene(points: Point[]) {
    this.step = 0;
    this.points = points;

    this.sceneStorage.createReadStorage(this.gpuContext, this.points);
    this.sceneStorage.createPointStorage(this.gpuContext, this.points, this.physicsData);
    this.sceneStorage.createTypeStorage(this.gpuContext, this.physicsData);
    this.sceneStorage.createForceStorage(this.gpuContext, this.physicsData);

    this.simulationCompute = new Compute(
      this.gpuContext.device,
      this.points.length,
      computeShader
    )
    this.simulationCompute.updateBindGroups(
      this.gpuContext.device,
      this.sceneStorage.positionsStorage,
      this.sceneStorage.typesStorage,
      this.sceneStorage.forcesStorage,
      this.sceneStorage.computeUniformsBuffer
    );

    this.simulationRenderer = new Render(
      this.gpuContext,
      new Shape(this.gpuContext.device, "Square Geometry", SQUARE),
      this.points.length
    )
    this.simulationRenderer.updateBindGroups(
      this.gpuContext.device,
      this.sceneStorage.positionsStorage,
      this.sceneStorage.typesStorage,
      this.sceneStorage.vertexUniformsBuffer,
      this.sceneStorage.selectionOutBuffer
    )
  }

  render() {

    this.sceneStorage.updateUniformsBuffer(this.gpuContext, this.camera);
    this.camera.updateCamera();

    const encoder = this.gpuContext.device.createCommandEncoder();

    this.simulationRenderer?.execute(
      encoder,
      this.step,
      this.gpuContext.context.getCurrentTexture().createView()
    );

    this.gpuContext.device.queue.submit([encoder.finish()]);
  }

  simulate() {
    const encoder = this.gpuContext.device.createCommandEncoder();
    this.simulationCompute?.execute(encoder, this.step, this.points.length);
    this.step++;
    this.gpuContext.device.queue.submit([encoder.finish()]);
  }

  public async getSelectedCircles() {
    const readBuffer = this.gpuContext.device.createBuffer({
      size: this.points.length * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const commandEncoder = this.gpuContext.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(this.sceneStorage.selectionOutBuffer, 0, readBuffer, 0, this.points.length * 4);
    const commands = commandEncoder.finish();
    this.gpuContext.device.queue.submit([commands]);

    // Now, map the buffer to access the data
    await readBuffer.mapAsync(GPUMapMode.READ);
    const data = Array.from(new Uint32Array(readBuffer.getMappedRange()));
    readBuffer.unmap();
    console.log(data.filter(d => d == 1));
  }

  async updatePositionsFromCompute() {
    let bufferIndex = this.step % 2;

    if (!this.points || this.points.length === 0) {
      return;
    }

    const readBuffer = this.gpuContext.device.createBuffer({
      size: this.sceneStorage.positionsStorage!![bufferIndex].size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const commandEncoder = this.gpuContext.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(this.sceneStorage.positionsStorage!![bufferIndex], 0, readBuffer, 0, this.sceneStorage.positionsStorage!![bufferIndex].size);
    const commands = commandEncoder.finish();
    this.gpuContext.device.queue.submit([commands]);

    // Now, map the buffer to access the data
    await readBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(readBuffer.getMappedRange());
    this.points.forEach((point, index) => {
      point.position = vec4.fromValues(
        data[index * 12 + 0],
        data[index * 12 + 1],
        data[index * 12 + 2],
        data[index * 12 + 3]
      );
    })
    readBuffer.unmap();
  }
}
