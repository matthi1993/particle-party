import { vec4 } from "gl-matrix";
import { create, ParticleType } from "./Point";
import { Force, SimulationData } from "./Simulation";

export const RED = new ParticleType("Red", 0, vec4.fromValues(1, 0, 0, 0.125), 100);
export const BLUE = new ParticleType("Blue", 1, vec4.fromValues(0, 0, 1, 0.125), 30);
export const YELLOW = new ParticleType("Yellow", 2, vec4.fromValues(1, 1, 0, 0.125), 80);
export const GREEN = new ParticleType("Green", 3, vec4.fromValues(0, 1, 0, 0.125), 150);


// ## Be aware that the order of the forces is important in the SHADER!!!
export function createDefaultSimulationModel() {
  let data = new SimulationData();


  data.forceByType = new Map()

  data.forceByType.set(RED, [
    new Force(RED, RED, 3),
    new Force(RED, BLUE, 0.25),
    new Force(RED, YELLOW, 10),
    new Force(RED, GREEN, 10),
  ]);

  data.forceByType.set(BLUE, [
    new Force(BLUE, RED, 0),
    new Force(BLUE, BLUE, 10),
    new Force(BLUE, YELLOW, -10),
    new Force(BLUE, GREEN, 0),
  ]);

  data.forceByType.set(YELLOW, [
    new Force(YELLOW, RED, 0.5),
    new Force(YELLOW, BLUE, 1.2),
    new Force(YELLOW, YELLOW, -2),
    new Force(YELLOW, GREEN, 10),
  ]);

  data.forceByType.set(GREEN, [
    new Force(GREEN, RED, 0.25),
    new Force(GREEN, BLUE, -0.25),
    new Force(GREEN, YELLOW, -2),
    new Force(GREEN, GREEN, -10),
  ]);

  data.points = create(8000, RED, 600)
    .concat(create(100, BLUE, 600))
    .concat(create(2000, YELLOW, 600))
    .concat(create(2000, GREEN, 600));

  return data;
}