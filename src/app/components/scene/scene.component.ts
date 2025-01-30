import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { PhysicsData } from '../../model/Simulation';
import { Square } from '../../utils';
import { computeShader } from '../../shader/computeShader'
import { Compute } from '../../gpu/gpu.compute'
import { Render } from '../../gpu/gpu.render'
import { GpuContext } from '../../gpu/gpu.context'

import { Camera } from '../../model/Camera';
import { Point } from 'src/app/model/Point';
import { SceneStorage } from './scene.gpu.storage';
import { vec4 } from 'gl-matrix';
import { MatIconModule } from '@angular/material/icon';
import { ndcToWorld, projectToScenePlane } from './scene.mousevent';

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
    80
  );
  public gpuContext: GpuContext = new GpuContext();
  private simulationCompute?: Compute;
  private simulationRenderer?: Render;
  private sceneStorage: SceneStorage = new SceneStorage();

  public step = 0;
  public isPlaying = false;
  private RENDER_UPDATE_INTERVAL = 50;
  private SIMULATION_UPDATE_INTERVAL = 25;
  private simulateIntervalId: any = undefined;
  private renderIntervalId: any = undefined;

  constructor() {
    this.gpuContext.setup().then(() => {

      this.gpuContext.canvas!.width = this.canvasWidth;
      this.gpuContext.canvas!.height = this.canvasHeight;

      this.sceneStorage.createCameraBuffer(this.gpuContext, this.camera);
      this.addCameraListeners(this.gpuContext.canvas!!);

      this.createScene(this.points);
      this.startRenderLoop();
      this.simulationLoop(true);
    });
  }

  ngOnInit(): void {
  }

  public simulationLoop(shouldPlay: boolean) {
    this.isPlaying = shouldPlay;

    if (shouldPlay && !this.simulateIntervalId) {
      this.simulateIntervalId = setInterval(() => {
        this.simulate();
      }, this.SIMULATION_UPDATE_INTERVAL);
    } else if (this.simulateIntervalId) {
      clearInterval(this.simulateIntervalId);
      this.simulateIntervalId = undefined;
      this.updatePositionsFromCompute();
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

    element.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0 && this.camera.position[2] <= 5) {
        this.camera.position[2] = 5;
      } else {
        this.camera.position[2] += event.deltaY / 30;
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
    this.sceneStorage.updatePointValues(this.gpuContext, this.points);

    this.step = 0;
  }

  public createScene(points: Point[]) {
    this.step = 0;
    this.points = points;

    this.sceneStorage.createPointStorage(this.gpuContext, this.points);
    this.sceneStorage.createTypeStorage(this.gpuContext, this.physicsData);
    this.sceneStorage.createForceStorage(this.gpuContext, this.physicsData);

    this.simulationCompute = new Compute(
      this.gpuContext.device,
      this.points.length,
      computeShader
    )
    this.simulationCompute.updateBindGroups(this.gpuContext.device, this.sceneStorage.positionsStorage, this.sceneStorage.typesStorage, this.sceneStorage.forcesStorage);

    this.simulationRenderer = new Render(
      this.gpuContext,
      new Square(this.gpuContext.device),
      this.points.length
    )
    this.simulationRenderer.updateBindGroups(this.gpuContext.device, this.sceneStorage.positionsStorage, this.sceneStorage.typesStorage, this.sceneStorage.forcesStorage, this.sceneStorage.viewProjectionBuffer)
  }

  render() {
    this.camera.updateCamera();
    this.sceneStorage.updateCameraBuffer(this.gpuContext, this.camera);

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
