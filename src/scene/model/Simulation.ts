import { ParticleType, Point } from 'src/scene/model/Point';
import { Structure } from 'src/scene/model/Structure';
import { ATTRACTION_CONSTANT, GRAVITY_CONSTANT } from '../scene-constants';

export class ParticleTypeWithForces {
  public type!: ParticleType;
  public forces: number[] = [];

  constructor(type: ParticleType) {
    this.type = type;
  }
}

export class SimulationData {
  public physicsData: PhysicsData = new PhysicsData(0, "none");
  public points: Point[] = [];
  public structures: Structure[] = [];
  public is3D: boolean = false;
}

export class PhysicsData {

  public id: number;
  public name: string;
  public types: ParticleType[] = [];
  public forces: number[][] = [];
  public gravityConstant: number = GRAVITY_CONSTANT;
  public attractionConstant: number = ATTRACTION_CONSTANT;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}