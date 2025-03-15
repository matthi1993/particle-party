import { vec4 } from "gl-matrix";
import { ParticleType } from "../../scene/model/Point";

export const PROTON = new ParticleType("Proton", 1, vec4.fromValues(1, 0.75, 0.75, 1), 10, 1.25, 5);
export const NEUTRON = new ParticleType("Neutron", 2, vec4.fromValues(0, 1, 1, 0.5), 10, 1, 0);
export const ELECTRON = new ParticleType("Electron", 3, vec4.fromValues(1, 1, 0, 0.5), 10, 0.75, 0.1);
export const BOSON = new ParticleType("Boson", 4, vec4.fromValues(0, 1, 0, 0.5), 10, 1, 0);