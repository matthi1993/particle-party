
import { ParticleType, Point, Vec4, create } from 'src/app/model/Point';

export class Force {
  public particleA: ParticleType;
  public particleB: ParticleType;
  public force: number;

  constructor(particleA: ParticleType, particleB: ParticleType, force: number) {
    this.particleA = particleA;
    this.particleB = particleB;
    this.force = force;
  }
}

export class SimulationData {
  public points: Point[] = [];
  public forceByType: Map<ParticleType, Force[]> = new Map();

  constructor() { }
}