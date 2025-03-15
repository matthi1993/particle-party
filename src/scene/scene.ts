import { vec3, vec4 } from "gl-matrix";
import { Compute } from "./gpu/gpu.compute";
import { GpuContext } from "./gpu/gpu.context";
import { Render } from "./gpu/gpu.render";
import { Camera } from "./model/Camera";
import { Point } from "./model/Point";
import { PhysicsData } from "./model/Simulation";
import { SceneStorage } from "./scene.gpu.storage";
import { computeShader } from "./gpu/shader/computeShader";
import { Shape } from "./gpu/shapes/shapes";
import { SQUARE } from "./gpu/shapes/square";
import { ndcToWorld, projectToScenePlane, getMouseNDC } from "./scene.mousevent";

export class ParticleSimulation {
  public isPlaying = false; // TODO getter

  private physicsData!: PhysicsData;
  private points!: Point[];
  private camera!: Camera;

  private gpuContext!: GpuContext;
  private simulationCompute?: Compute;
  private simulationRenderer?: Render;
  private sceneStorage: SceneStorage = new SceneStorage();

  private step = 0;
  private RENDER_UPDATE_INTERVAL = 30;
  private SIMULATION_UPDATE_INTERVAL = 30;
  private simulateIntervalId: any = undefined;
  private renderIntervalId: any = undefined;

  private mousePos = vec3.fromValues(0, 0, 0);

  constructor() {
  }

  public async setup(canvas: HTMLCanvasElement, width: number, height: number) {
    this.gpuContext = new GpuContext(canvas, width, height);
    this.camera = new Camera(width, height, 200);
    await this.gpuContext.setup();

    // set Camera Movement Listeners
    this.addCameraListeners(this.gpuContext.canvas!!);

    // Compute and Render Pipelines
    this.simulationCompute = new Compute(
      this.gpuContext.device,
      computeShader
    )
    this.simulationRenderer = new Render(
      this.gpuContext,
      new Shape(this.gpuContext.device, "Square Geometry", SQUARE)
    )

    // set all buffers
    this.sceneStorage.createComputeUniformBuffer(this.gpuContext)
    this.sceneStorage.createUniformBuffer(this.gpuContext, this.camera);
  }

  public setScene(physicsData: PhysicsData, points: Point[]) {
    this.step = 0;

    this.physicsData = physicsData;
    this.points = points;

    this.sceneStorage.createTypeStorage(this.gpuContext, this.physicsData);
    this.sceneStorage.createForceStorage(this.gpuContext, this.physicsData);

    this.sceneStorage.createReadStorage(this.gpuContext, this.points, this.physicsData);
    this.sceneStorage.createPointStorage(this.gpuContext, this.points, this.physicsData);

    this.updateBindGroups();
  }

  public updatePhysics(physicsData: PhysicsData, recreate: boolean) {
    this.physicsData = physicsData;
    this.sceneStorage.updateForceValues(this.gpuContext, this.physicsData);
    this.sceneStorage.updateTypeValues(this.gpuContext, this.physicsData);
  }

  public async updatePoints(points: Point[], recreate: boolean) {
    this.points = points;
    this.sceneStorage.updatePointValues(this.gpuContext, this.points, this.physicsData);
  }

  public setUniforms() {

  }

  private updateBindGroups() {
    if(this.simulationCompute) {
      this.simulationCompute.updateBindGroups(
        this.gpuContext.device,
        this.sceneStorage.positionsStorage,
        this.sceneStorage.typesStorage,
        this.sceneStorage.forcesStorage,
        this.sceneStorage.computeUniformsBuffer
      );
    }
    if(this.simulationRenderer) {
      this.simulationRenderer.updateBindGroups(
        this.gpuContext.device,
        this.sceneStorage.positionsStorage,
        this.sceneStorage.typesStorage,
        this.sceneStorage.vertexUniformsBuffer,
        this.sceneStorage.selectionOutBuffer
      )
    }
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
    }
  }

  public renderLoop(shouldPlay: boolean) {
    if (shouldPlay && !this.renderIntervalId) {
      this.renderIntervalId = setInterval(() => {
        this.render();
      }, this.RENDER_UPDATE_INTERVAL);
    } else if (this.renderIntervalId) {
      clearInterval(this.renderIntervalId);
      this.renderIntervalId = undefined;
    }
  }

  // TODO make work
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
  }

  // TODO refactor somewhere else
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
      this.mousePos = projectToScenePlane(worldPoint, this.camera);

      this.sceneStorage.updateComputeUniformsBuffer( //TODO remove???
        this.gpuContext,
        vec4.fromValues(this.mousePos[0], this.mousePos[1], this.mousePos[2], 1)
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

  render() {
    if(!this.renderIntervalId) return;

    this.sceneStorage.updateUniformsBuffer(this.gpuContext, this.camera, this.mousePos[0], this.mousePos[1]);
    this.camera.updateCamera();

    const encoder = this.gpuContext.device.createCommandEncoder();

    this.simulationRenderer?.execute(
      encoder,
      this.step,
      this.gpuContext.context.getCurrentTexture().createView(),
      this.points.length
    );

    this.gpuContext.device.queue.submit([encoder.finish()]);
  }

  simulate() {
    if(!this.simulateIntervalId) return;

    const encoder = this.gpuContext.device.createCommandEncoder();
    this.simulationCompute?.execute(encoder, this.step, this.points.length);
    this.step++;
    this.gpuContext.device.queue.submit([encoder.finish()]);
  }

  // TODO 
  async getPositions() {
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