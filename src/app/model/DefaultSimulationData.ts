import { create, ParticleType, Vec4 } from "./Point";
import { Force, SimulationData } from "./Simulation";

export const RED = new ParticleType("Red", 0, new Vec4(1, 0, 0, 1), 500);
export const BLUE = new ParticleType("Blue", 1, new Vec4(0, 0, 1, 1), 80);
export const YELLOW = new ParticleType("Yellow", 2, new Vec4(1, 1, 0, 1), 80);
export const GREEN = new ParticleType("Green", 3, new Vec4(0, 1, 0, 1), 80);


// ## Be aware that the order of the forces is important in the SHADER!!!
export function createDefaultSimulationModel() {
  let data = new SimulationData();


  data.forceByType = new Map()

  data.forceByType.set(RED, [
    new Force(RED, RED, 1),
    new Force(RED, BLUE, 0.25),
    new Force(RED, YELLOW, 0.25),
    new Force(RED, GREEN, -0.5),
  ]);

  data.forceByType.set(BLUE, [
    new Force(BLUE, RED, 0.5),
    new Force(BLUE, BLUE, -0.75),
    new Force(BLUE, YELLOW, -1.5),
    new Force(BLUE, GREEN, 1),
  ]);

  data.forceByType.set(YELLOW, [
    new Force(YELLOW, RED, 0.5),
    new Force(YELLOW, BLUE, 1.2),
    new Force(YELLOW, YELLOW, -0.66),
    new Force(YELLOW, GREEN, 0.5),
  ]);

  data.forceByType.set(GREEN, [
    new Force(GREEN, RED, 0.25),
    new Force(GREEN, BLUE, -0.25),
    new Force(GREEN, YELLOW, -0.25),
    new Force(GREEN, GREEN, -0.25),
  ]);

  data.points = create(4000, RED)
    .concat(create(4000, BLUE))
    .concat(create(4000, YELLOW))
    .concat(create(4000, GREEN));

  return data;
}