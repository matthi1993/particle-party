export class Vec4 {
    public x: number = 1;
    public y: number = 1;
    public z: number = 1;
    public w: number = 1;

    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

export class ParticleType {
    public id;
    public color;
    public radius;

    constructor(id: number, color: Vec4, radius: number) {
        this.id = id;
        this.color = color;
        this.radius = radius;
    }
}


export class Point {
    public position: Vec4;
    public particleType: ParticleType;

    constructor(x: number, y: number, type: ParticleType) {
        this.position = new Vec4(x, y, 0, 0);
        this.particleType = type;
    }
}

export function create(count: number, type: ParticleType) {
    let list = [];
    let size = 600;

    for (let i = 0; i < count; i++) {
        list.push(new Point(Math.random() * size - size / 2, Math.random() * size - size / 2, type));
    }
    return list;
}