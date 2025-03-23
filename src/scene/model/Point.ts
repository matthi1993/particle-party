
import { vec4 } from 'gl-matrix';

export class Structure {
    public id?: number;
    public name: string = "";
    public points: Point[] = []
}

export class ParticleType {
    public id: number;
    public name;
    public color;
    public radius;
    public size;
    public mass;

    constructor(name: string, id: number, color: vec4, radius: number, size: number, mass: number) {
        this.name = name;
        this.color = color;
        this.radius = radius;
        this.size = size;
        this.mass = mass;
        this.id = id;
    }
}


export class Point {
    public position: vec4;
    public velocity: vec4 = vec4.fromValues(0,0,0,0);
    public particleTypeId: number;
    
    constructor(position: vec4, typeId: number) {
        this.position = position;
        this.particleTypeId = typeId;
    }
}

export function create(count: number, type: ParticleType, size: number) {
    let list = [];
    for (let i = 0; i < count; i++) {
        let point = randomPointInSphere(size);
        list.push(
            new Point(
                vec4.fromValues(
                    point.x,
                    point.y,
                    0,//point.z,
                    1
                ),
                type.id
            ));
    }
    return list;
}

function randomPointInSphere(radius: number): { x: number; y: number; z: number } {
    const phi = Math.random() * 2 * Math.PI; // Random azimuthal angle (0 to 2π)
    const theta = Math.acos(2 * Math.random() - 1); // Random polar angle (0 to π)
    const r = Math.cbrt(Math.random()) * radius; // Random radius (cube root for uniform distribution)

    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);

    return { x, y, z };
}