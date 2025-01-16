const SQUARE = new Float32Array([
    -1, -1,
    1, -1,
    1, 1,
    -1, -1,
    1, 1,
    -1, 1,
]);

export class Square {

    public vertices: any;
    public vertexBuffer: any;
    public vertexBufferLayout;

    constructor(device: any) {
        this.vertices = SQUARE;

        this.vertexBuffer = device.createBuffer({
            label: "Cell vertices",
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.vertexBufferLayout = {
            arrayStride: 8,
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
            }],
        };

        device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    }
}

class Point {

    public x: number;
    public y: number;
    public z: number;
    public w: number;
    public type: number;

    constructor(x: number, y: number, type: number) {
        this.x = x;
        this.y = y;
        this.z = 0;
        this.w = 0;
        this.type = type;
    }
}

export function create(count: number, type: number) {
    let list = [];
    let size = 400;

    for (let i = 0; i < count; i++) {
        list.push(new Point(Math.random() * size - size / 2, Math.random() * size - size / 2, type));
    }
    return list;
}

export function createArraysFromPoints(points: Point[]) {
    let dimensions = 12;

    let positionArray = new Float32Array(points.length * dimensions);


    for (let i = 0; i < points.length; i++) {

        const element = points[i];

        // set position
        positionArray[i * dimensions] = element.x;
        positionArray[i * dimensions + 1] = element.y;
        positionArray[i * dimensions + 2] = element.z;
        positionArray[i * dimensions + 3] = element.w;

        // set velocity
        // nothing to do as everything is 0
        positionArray[i * dimensions + 8] = element.type;
    };
    return positionArray;
}