
import { vec4 } from 'gl-matrix';

export class ParticleType {
    public name;
    public id;
    public color;
    public radius;
    public size;
    public mass;

    constructor(name: string, id: number, color: vec4, radius: number, size: number, mass: number) {
        this.name = name;
        this.id = id;
        this.color = color;
        this.radius = radius;
        this.size = size;
        this.mass = mass;
    }
}


export class Point {
    public position: vec4;
    public particleType: ParticleType;

    constructor(position: vec4, type: ParticleType) {
        this.position = position;
        this.particleType = type;
    }
}

export function create(count: number, type: ParticleType, size: number) {
    let list = [];
    for (let i = 0; i < count; i++) {
        list.push(
            new Point(
                vec4.fromValues(
                    0,//Math.random() * size - size / 2,
                    Math.random() * size - size / 2,
                    Math.random() * size - size / 2,
                    0
                ),
                type
            ));
    }
    return list;
}