import { PhysicsData } from './model/Simulation';
import { createArraysFromPoints, createForcesArray, createTypesArray } from './gpu/scene-utils';
import { GpuContext } from './gpu/gpu.context'

import { Camera } from './model/Camera';
import { Point } from 'src/scene/model/Point';
import { vec4 } from 'gl-matrix';

export class SceneStorage {

  public forcesStorage?: any;
  public typesStorage?: any;
  public positionsStorage?: any;

  public selectionOutBuffer?: any;
  public positionBuffer?: any;
  public vertexUniformsBuffer?: any;
  public computeUniformsBuffer?: any;

  constructor() {
  }

  createComputeUniformBuffer(gpuContext: GpuContext) {
    let uniforms = new Float32Array([
      0.006674,
      0.05
    ])
    this.computeUniformsBuffer = gpuContext.device.createBuffer({
      size: uniforms.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    gpuContext.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniforms);
  }

  createUniformBuffer(gpuContext: GpuContext, camera: Camera, selectionCoord: vec4 = vec4.fromValues(0,0,0,-1)) {
    let uniforms = new Float32Array([
      ...camera.getViewProjectionMatrix(),
      ...selectionCoord
    ])
    this.vertexUniformsBuffer = gpuContext.device.createBuffer({
      size: uniforms.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    gpuContext.device.queue.writeBuffer(this.vertexUniformsBuffer, 0, uniforms);
  }

  public createForceStorage(gpuContext: GpuContext, physicsData: PhysicsData) {
    let forcesArray = createForcesArray(physicsData.forces);
    this.forcesStorage = gpuContext.createStorageBuffer("Forces", forcesArray.byteLength);
    gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);
  }

  public updateUniformsBuffer(gpuContext: GpuContext, camera: Camera, mouseX: number, mouseY: number) {
    let uniforms = new Float32Array([
      ...camera.getViewProjectionMatrix(),
      mouseX, 
      mouseY,
      0,
      0
    ])
    gpuContext.device.queue.writeBuffer(this.vertexUniformsBuffer, 0, uniforms);
  }

  public updateComputeUniformsBuffer(gpuContext: GpuContext) {
    let uniforms = new Float32Array([
      0.006674, // TODO refactor this somewhere else
      0.05 // TODO refactor this somewhere else
    ])
    gpuContext.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniforms);
  }

  public updateForceValues(gpuContext: GpuContext, physicsData: PhysicsData) {
    let forcesArray = createForcesArray(physicsData.forces);
    gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);
  }

  public createTypeStorage(gpuContext: GpuContext, physicsData: PhysicsData) {
    let typesArray = createTypesArray(physicsData.types);
    this.typesStorage = gpuContext.createStorageBuffer("Types", typesArray.byteLength);
    gpuContext.device.queue.writeBuffer(this.typesStorage, 0, typesArray);
  }

  public updateTypeValues(gpuContext: GpuContext, physicsData: PhysicsData) {
    let typesArray = createTypesArray(physicsData.types);
    gpuContext.device.queue.writeBuffer(this.typesStorage, 0, typesArray);
  }

  public createReadStorage(gpuContext: GpuContext, points: Point[], physicsData: PhysicsData) {
    let positionArray = createArraysFromPoints(points, physicsData);
    this.selectionOutBuffer = gpuContext.createStorageBuffer("Selection Out", positionArray.byteLength);
    gpuContext.device.queue.writeBuffer(this.selectionOutBuffer, 0, positionArray);
  }

  public createPointStorage(gpuContext: GpuContext, points: Point[], physicsData: PhysicsData) {
    let positionArray = createArraysFromPoints(points, physicsData);
    this.positionsStorage = [
      gpuContext.createStorageBuffer("Positions In", positionArray.byteLength),
      gpuContext.createStorageBuffer("Positions Out", positionArray.byteLength)
    ];
    gpuContext.device.queue.writeBuffer(this.positionsStorage[0], 0, positionArray);
  }

  public updatePointValues(gpuContext: GpuContext, points: Point[], physicsData: PhysicsData) {
    let positionArray = createArraysFromPoints(points, physicsData);
    gpuContext.device.queue.writeBuffer(this.positionsStorage[0], 0, positionArray);
  }
}
