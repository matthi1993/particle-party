import { PhysicsData } from '../../model/Simulation';
import { createArraysFromPoints, createForcesArray, createTypesArray } from '../../utils';
import { GpuContext } from './gpu/gpu.context'

import { Camera } from '../../model/Camera';
import { Point } from 'src/app/model/Point';

export class SceneStorage {

  public forcesStorage?: any;
  public typesStorage?: any;
  public positionsStorage?: any;

  public positionBuffer?:any;

  public viewProjectionBuffer?: any;

  constructor() {
  }

  createCameraBuffer(gpuContext: GpuContext, camera: Camera) {
    this.viewProjectionBuffer = gpuContext.device.createBuffer({
      size: 64, // 4x4 matrix of 4-byte floats
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    gpuContext.device.queue.writeBuffer(this.viewProjectionBuffer, 0, new Float32Array(camera.getViewProjectionMatrix())
    );
  }

  public updateCameraBuffer(gpuContext: GpuContext, camera: Camera) {
    gpuContext.device.queue.writeBuffer(this.viewProjectionBuffer, 0, new Float32Array(camera.getViewProjectionMatrix()));
  }

  public createForceStorage(gpuContext: GpuContext, physicsData: PhysicsData) {
    let forcesArray = createForcesArray(physicsData.forces);
    this.forcesStorage = gpuContext.createStorageBuffer("Forces", forcesArray.byteLength);
    gpuContext.device.queue.writeBuffer(this.forcesStorage, 0, forcesArray);
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
