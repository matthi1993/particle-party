import { PhysicsData } from '../model/Simulation';
import { createArraysFromPoints, createForcesArray, createTypesArray } from './scene-utils';
import { GpuContext } from './gpu.context'

import { Camera } from '../model/Camera';
import { Point } from 'src/scene/model/Point';
import { vec4 } from 'gl-matrix';
import {ATTRACTION_CONSTANT, GRAVITY_CONSTANT} from "../scene-constants";

export class SceneStorage {

  public forcesStorage?: any;
  public typesStorage?: any;
  public positionsStorage?: any;

  public selectionOutBuffer?: any;
  public renderUniformsBuffer?: any;
  public computeUniformsBuffer?: any;

  constructor() {
  }

  createComputeUniformBuffer(gpuContext: GpuContext) {
    let uniforms = new Float32Array([
      GRAVITY_CONSTANT,
      ATTRACTION_CONSTANT
    ])
    this.computeUniformsBuffer = gpuContext.device.createBuffer({
      size: uniforms.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    gpuContext.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniforms);
  }

  createRenderUniformBuffer(gpuContext: GpuContext, camera: Camera, selectionCoord: vec4 = vec4.fromValues(0,0,0,-1)) {
    let uniforms = new Float32Array([
      ...camera.getViewProjectionMatrix(),
      ...selectionCoord
    ])
    this.renderUniformsBuffer = gpuContext.device.createBuffer({
      size: uniforms.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    gpuContext.device.queue.writeBuffer(this.renderUniformsBuffer, 0, uniforms);
  }

  public createForceStorage(gpuContext: GpuContext, physicsData: PhysicsData) {
    let forcesArray = createForcesArray(physicsData.forces);
    this.forcesStorage = gpuContext.createStorageBuffer("Forces", forcesArray.byteLength);
    gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);
  }

  public updateRenderUniformsBuffer(gpuContext: GpuContext, camera: Camera, mouseX: number, mouseY: number, brushRadius: number) {
    let uniforms = new Float32Array([
      ...camera.getViewProjectionMatrix(),
      mouseX, 
      mouseY,
      brushRadius,
      0
    ])
    gpuContext.device.queue.writeBuffer(this.renderUniformsBuffer, 0, uniforms);
  }

  public updateComputeUniformsBuffer(gpuContext: GpuContext) {
    let uniforms = new Float32Array([
      GRAVITY_CONSTANT,
      ATTRACTION_CONSTANT
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
    let positionArray = createArraysFromPoints(points);
    this.selectionOutBuffer = gpuContext.createStorageBuffer("Selection Out", positionArray.byteLength);
    gpuContext.device.queue.writeBuffer(this.selectionOutBuffer, 0, positionArray);
  }

  public createPointStorage(gpuContext: GpuContext, points: Point[], physicsData: PhysicsData) {
    let positionArray = createArraysFromPoints(points);
    this.positionsStorage = [
      gpuContext.createStorageBuffer("Positions In", positionArray.byteLength),
      gpuContext.createStorageBuffer("Positions Out", positionArray.byteLength)
    ];
    gpuContext.device.queue.writeBuffer(this.positionsStorage[0], 0, positionArray);
  }

  public updatePointValues(gpuContext: GpuContext, points: Point[], physicsData: PhysicsData) {
    let positionArray = createArraysFromPoints(points);
    gpuContext.device.queue.writeBuffer(this.positionsStorage[0], 0, positionArray);
  }
}
