import { ParticleType, Point } from './model/Point'


const SQUARE = new Float32Array([
    -1, -1,
    1, -1,
    1, 1,
    -1, -1,
    1, 1,
    -1, 1,
]);

const OCTAGON = new Float32Array([

    0, 0,
    -1, 0,
    -0.75, 0.75,

    0, 0,
    -0.75, 0.75,
    0, 1,

    0, 0,
    0, 1,
    0.75, 0.75,

    0, 0,
    1, 0,
    0.75, 0.75,

    0, 0,
    1, 0,
    0.75, -0.75,

    0, 0,
    0.75, -0.75,
    0, -1,

    0, 0,
    0, -1,
    -0.75, -0.75,

    0, 0,
    -0.75, -0.75,
    -1, 0
]);

export class Square {

    public vertices: any;
    public vertexBuffer: any;
    public vertexBufferLayout;

    constructor(device: any) {
        this.vertices = OCTAGON;

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

export function createArraysFromPoints(points: Point[]) {
    let dimensions = 12;
    let positionArray = new Float32Array(points.length * dimensions);

    for (let i = 0; i < points.length; i++) {
        const element = points[i];

        positionArray[i * dimensions] = element.position[0];
        positionArray[i * dimensions + 1] = element.position[1];
        positionArray[i * dimensions + 2] = element.position[2];
        positionArray[i * dimensions + 3] = element.position[3];

        positionArray[i * dimensions + 8] = element.particleType.id;
    };
    return positionArray;
}

export function createTypesArray(types: ParticleType[]) {
    let dimensions = 8;
    let typesArray = new Float32Array(types.length * dimensions);

    let index = 0;
    types.forEach((key) => {
        typesArray[index * dimensions + 0] = key.color[0];
        typesArray[index * dimensions + 1] = key.color[1];
        typesArray[index * dimensions + 2] = key.color[2];
        typesArray[index * dimensions + 3] = key.color[3];

        typesArray[index * dimensions + 4] = key.id;
        typesArray[index * dimensions + 5] = key.radius;
        typesArray[index * dimensions + 6] = key.size;
        typesArray[index * dimensions + 7] = key.mass;

        index++;
    });
    return typesArray;
}

export function createForcesArray(forces: number[][]) {
    let dimensions = 3;
    let forceArray = new Float32Array(forces.flat().length * dimensions);

    let index = 0;
    forces.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
            forceArray[index * dimensions + 0] = rowIndex;
            forceArray[index * dimensions + 1] = colIndex;
            forceArray[index * dimensions + 2] = col;

            index++;
        });
    });

    return forceArray;
}