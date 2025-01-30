
import { ParticleType, Point } from 'src/app/model/Point';

export class ParticleTypeWithForces {
  public type!: ParticleType;
  public forces: number[] = [];

  constructor(type: ParticleType) {
    this.type = type;
  }
}

export class PhysicsData {

  public types: ParticleType[] = [];
  public forces: number[][] = [];

  constructor() { }

  public addType(newType: ParticleType) {
    this.types.push(newType);
    this.forces.push(
      Array(this.types.length).fill(0) //TODO, update all forces of all particles and set init value
    );
  }

  public removeType(type: ParticleType) {
    let index = this.types.indexOf(type);
    if (this.types.length > 1) {
      this.types.splice(index, 1)
      this.forces.splice(index, 1);
      this.forces.forEach(row => {
        row.splice(index, 1);
      })
    }
  }
}