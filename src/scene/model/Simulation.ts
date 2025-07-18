
import { ParticleType, Point } from 'src/scene/model/Point';
import { Structure } from 'src/scene/model/Structure';

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
}

export class PhysicsData {

  public id: number;
  public name: string;
  public types: ParticleType[] = [];
  public forces: number[][] = [];

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}