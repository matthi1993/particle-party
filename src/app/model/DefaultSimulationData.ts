import { vec4 } from "gl-matrix";
import { ParticleType } from "./Point";
import { PhysicsData } from "./Simulation";

export const PROTON = new ParticleType("Proton", 0, vec4.fromValues(1, 0.75, 0.75, 1), 10, 1.5, 0);
export const NEUTRON = new ParticleType("Neutron", 1, vec4.fromValues(0, 1, 1, 0.5), 10, 1, 0);
export const ELECTRON = new ParticleType("Electron", 2, vec4.fromValues(1, 1, 0, 0.5), 10, 0.75, 0);
export const BOSON = new ParticleType("Boson", 3, vec4.fromValues(0, 1, 0, 0.5), 10, 1, 0);

export function createDefaultPhysicsModel() {
  let data = new PhysicsData();

  data.addType(PROTON);
  data.addType(NEUTRON);
  data.addType(ELECTRON);
  data.addType(BOSON);
  
  data.forces = [
    [-0.25, 0.4, 0, 0],
    [-0.1, -0.1, 0.1, 0],
    [-0.3,-0.3, 0, -0.30],
    [-0.33, 0.23, 0, 1]
  ]

  return data;
}