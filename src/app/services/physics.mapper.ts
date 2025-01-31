import { vec4 } from "gl-matrix";
import { ParticleType } from "../model/Point";
import { PhysicsData } from "../model/Simulation";


export interface PhysicsResponse {
    id: number,
    name: string,
    particle_types: any[]
}

export function mapPhysicsRequest(response: PhysicsResponse) {
    let physics = new PhysicsData(response.id, response.name);
    response.particle_types.forEach(type => {
        physics.types.push(new ParticleType(
            type.name,
            type.id,
            vec4.fromValues(type.color.r, type.color.g, type.color.b, 1),
            type.radius,
            type.size,
            type.mass
        ));
        physics.forces.push(
            type.related_to.map((val: { force: any; }) => val.force)
        );
    });
    return physics;
}