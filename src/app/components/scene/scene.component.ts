import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { PhysicsData } from '../../model/Simulation';
import { Square, createArraysFromPoints, createForcesArray, createTypesArray } from '../../utils';
import { computeShader } from '../../shader/computeShader'
import { Compute } from '../../gpu/gpu.compute'
import { Render } from '../../gpu/gpu.render'
import { GpuContext } from '../../gpu/gpu.context'

import { Camera } from '../../model/Camera';
import { Point } from 'src/app/model/Point';
import { SceneStorage } from './scene.gpu.storage';
import { mat4, vec4 } from 'gl-matrix';
import { getMouseNDC, ndcToWorld, projectToScenePlane } from './scene.mousevent';

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
  private sceneStorage: SceneStorage = new SceneStorage();

  private step = 0;
  public isPlaying = false;
  private RENDER_UPDATE_INTERVAL = 50;
  private SIMULATION_UPDATE_INTERVAL = 25;

  private simulateIntervalId: any = undefined;
  private renderIntervalId: any = undefined;

  // Editing
  @Input() public editingPointStructure?: Point[];



  async ngOnInit() {
    await this.gpuContext.setup().then(() => {
      this.sceneStorage.createCameraBuffer(this.gpuContext, this.camera);
      this.addCameraListeners(this.gpuContext.canvas!!);

      this.createScene();
      this.startRenderLoop();
      this.simulationLoop(false);
    });
  }

  public simulationLoop(shouldPlay: boolean) {
    this.isPlaying = shouldPlay;
    console.log(this.isPlaying);
    if (shouldPlay && !this.simulateIntervalId) {
      this.simulateIntervalId = setInterval(() => {
        this.simulate();
      }, this.SIMULATION_UPDATE_INTERVAL);
    } else if (this.simulateIntervalId) {
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
    if (this.renderIntervalId) {
      clearInterval(this.renderIntervalId);
    }
    if (this.simulateIntervalId) {
      clearInterval(this.simulateIntervalId);
    }
  }

  addCameraListeners(element: HTMLElement) {
    element.addEventListener('mousedown', (event) => {
      event.preventDefault();

      if (this.editingPointStructure) {
        const ndc = getMouseNDC(event, element);
        const worldPoint = ndcToWorld(ndc, this.camera);
        const scenePoint = projectToScenePlane(worldPoint, this.camera);
        
        let pointsToAdd: Point[] = [];
        this.editingPointStructure.forEach(point => {
          let newPosition = vec4.fromValues(0, 0, 0, 0);
          vec4.add(newPosition, point.position, vec4.fromValues(scenePoint[0], scenePoint[1], scenePoint[2], 1));
          pointsToAdd.push(new Point(
            newPosition,
            point.particleType
          ));
        })

        this.points.push(...pointsToAdd);
        this.createScene();
      }
    });

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

  public createScene() {
    this.step = 0;

    if (!this.points || this.points.length == 0) {
      return;
    }

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
}
