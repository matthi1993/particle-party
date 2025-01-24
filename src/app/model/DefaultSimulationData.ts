import { vec4 } from "gl-matrix";
import { create, ParticleType } from "./Point";
import { Force, SimulationData } from "./Simulation";

export const PROTON = new ParticleType("Proton", 0, vec4.fromValues(1, 0.75, 0.75, 1), 100, 15, 0.01);
export const Neutron = new ParticleType("Neutron", 1, vec4.fromValues(0, 1, 1, 0.5), 100, 10, 0.01);
export const YELLOW = new ParticleType("Yellow", 2, vec4.fromValues(1, 1, 0, 0.5), 100,20, 1);
export const GREEN = new ParticleType("Green", 3, vec4.fromValues(0, 1, 0, 0.5), 100, 20, 2);


// ## Be aware that the order of the forces is important in the SHADER!!!
export function createDefaultSimulationModel() {
  let data = new SimulationData();


  data.forceByType = new Map()

  data.forceByType.set(PROTON, [
    new Force(PROTON, PROTON, -1),
    new Force(PROTON, Neutron, 2),
    new Force(PROTON, YELLOW, 0),
    new Force(PROTON, GREEN, 0),
  ]);

  data.forceByType.set(Neutron, [
    new Force(Neutron, PROTON, -0.5),
    new Force(Neutron, Neutron, -0.5),
    new Force(Neutron, YELLOW, 0),
    new Force(Neutron, GREEN, 0),
  ]);

  data.points = create(1000, PROTON, 1200)
    .concat(create(1000, Neutron, 1200));

  return data;
}