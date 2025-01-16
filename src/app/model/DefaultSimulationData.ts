import { create, ParticleType, Vec4 } from "./Point";
import { Force, SimulationData } from "./Simulation";

export const RED = new ParticleType("Red", 0, new Vec4(1, 0, 0, 1), 100);
export const GREEN = new ParticleType("Green", 1, new Vec4(0, 1, 0, 1), 100);
export const BLUE = new ParticleType("Blue", 2, new Vec4(0, 0, 1, 1), 100);
export const YELLOW = new ParticleType("Yellow", 3, new Vec4(1, 1, 0, 1), 100);

export function createDefaultSimulationModel() {
    let data = new SimulationData();


    data.forceByType = new Map()
    data.forceByType.set(RED, [
      new Force(RED, RED, -10),
      new Force(RED, GREEN, 10),
      new Force(RED, BLUE, 0),
      new Force(RED, YELLOW, 10),
    ]);


    data.forceByType.set(GREEN, [
      new Force(GREEN, RED, 10),
      new Force(GREEN, GREEN, 10),
      new Force(GREEN, BLUE, 5),
      new Force(GREEN, YELLOW, 2),
    ]);

    data.forceByType.set(BLUE, [
      new Force(BLUE, RED, 0),
      new Force(BLUE, GREEN, 5),
      new Force(BLUE, BLUE, 10),
      new Force(BLUE, YELLOW, -3),
    ]);

    data.forceByType.set(YELLOW, [
      new Force(YELLOW, RED, 10),
      new Force(YELLOW, GREEN, 2),
      new Force(YELLOW, BLUE, -3),
      new Force(YELLOW, YELLOW, -10),
    ]);

    data.points = create(3000, RED)
      .concat(create(3000, GREEN))
      .concat(create(3000, BLUE))
      .concat(create(3000, YELLOW));

    return data;
}