import { vec4 } from "gl-matrix";
import { ParticleType } from "./Point";
import { PhysicsData } from "./Simulation";

export const PROTON = new ParticleType("Proton", 0, vec4.fromValues(1, 0.75, 0.75, 1), 20, 1, 0.1);
export const NEUTRON = new ParticleType("Neutron", 1, vec4.fromValues(0, 1, 1, 0.5), 20, 1, 0.1);
export const YELLOW = new ParticleType("Yellow", 2, vec4.fromValues(1, 1, 0, 0.5), 20,1, 1);
export const GREEN = new ParticleType("Green", 3, vec4.fromValues(0, 1, 0, 0.5), 20, 1, 2);

export function createDefaultPhysicsModel() {
  let data = new PhysicsData();

  data.addType(PROTON);
  data.addType(NEUTRON);
  data.forces = [
    [-0.1,0],
    [0, -0.1]
  ]

  return data;
}