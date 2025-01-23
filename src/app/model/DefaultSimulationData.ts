import { vec4 } from "gl-matrix";
import { create, ParticleType } from "./Point";
import { Force, SimulationData } from "./Simulation";

export const RED = new ParticleType("Red", 0, vec4.fromValues(1, 0, 0, 1), 100);
export const BLUE = new ParticleType("Blue", 1, vec4.fromValues(0, 1, 1, 1), 100);
export const YELLOW = new ParticleType("Yellow", 2, vec4.fromValues(1, 1, 0, 1), 100);
export const GREEN = new ParticleType("Green", 3, vec4.fromValues(0, 1, 0, 1), 100);


// ## Be aware that the order of the forces is important in the SHADER!!!
export function createDefaultSimulationModel() {
  let data = new SimulationData();


  data.forceByType = new Map()

  data.forceByType.set(RED, [
    new Force(RED, RED, 0),
    new Force(RED, BLUE, 0),
    new Force(RED, YELLOW, 0),
    new Force(RED, GREEN, 0),
  ]);

  data.forceByType.set(BLUE, [
    new Force(BLUE, RED, 0),
    new Force(BLUE, BLUE, 0),
    new Force(BLUE, YELLOW, 0),
    new Force(BLUE, GREEN, 0),
  ]);

  data.forceByType.set(YELLOW, [
    new Force(YELLOW, RED, 0),
    new Force(YELLOW, BLUE, 0),
    new Force(YELLOW, YELLOW, 0),
    new Force(YELLOW, GREEN, 0),
  ]);

  data.forceByType.set(GREEN, [
    new Force(GREEN, RED, 0),
    new Force(GREEN, BLUE, 0),
    new Force(GREEN, YELLOW, 0),
    new Force(GREEN, GREEN, 0),
  ]);

  data.points = create(100, RED, 1000)
    .concat(create(100, BLUE, 1000))
    .concat(create(100, YELLOW, 1000))
    .concat(create(100, GREEN, 1000));

  return data;
}