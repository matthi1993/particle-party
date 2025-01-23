import { vec4 } from "gl-matrix";
import { create, ParticleType } from "./Point";
import { Force, SimulationData } from "./Simulation";

export const RED = new ParticleType("Red", 0, vec4.fromValues(1, 0, 0, 0.125), 100);
export const BLUE = new ParticleType("Blue", 1, vec4.fromValues(0, 1, 1, 0.125), 100);
export const YELLOW = new ParticleType("Yellow", 2, vec4.fromValues(1, 1, 0, 0.125), 80);
export const GREEN = new ParticleType("Green", 3, vec4.fromValues(0, 1, 0, 0.125), 150);


// ## Be aware that the order of the forces is important in the SHADER!!!
export function createDefaultSimulationModel() {
  let data = new SimulationData();


  data.forceByType = new Map()

  data.forceByType.set(RED, [
    new Force(RED, RED, -1),
    new Force(RED, BLUE, 0),
    new Force(RED, YELLOW, -0.52),
    new Force(RED, GREEN, -0.72),
  ]);

  data.forceByType.set(BLUE, [
    new Force(BLUE, RED, 0),
    new Force(BLUE, BLUE, 1),
    new Force(BLUE, YELLOW, -2),
    new Force(BLUE, GREEN, 2),
  ]);

  data.forceByType.set(YELLOW, [
    new Force(YELLOW, RED, 10),
    new Force(YELLOW, BLUE, 2),
    new Force(YELLOW, YELLOW, -5),
    new Force(YELLOW, GREEN, 10),
  ]);

  data.forceByType.set(GREEN, [
    new Force(GREEN, RED, 0.725),
    new Force(GREEN, BLUE, -0.25),
    new Force(GREEN, YELLOW, -1),
    new Force(GREEN, GREEN, -0.5),
  ]);

  data.points = create(2000, RED, 1000)
    .concat(create(2000, BLUE, 1000))
    .concat(create(2000, YELLOW, 1000))
    .concat(create(3000, GREEN, 1000));

  return data;
}