import { ParticleType, Point } from './model/Point'
import { Force } from './model/Simulation';


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

export function createArraysFromPoints(points: Point[]) {
    let dimensions = 12;
    let positionArray = new Float32Array(points.length * dimensions);

    for (let i = 0; i < points.length; i++) {
        const element = points[i];

        positionArray[i * dimensions] = element.position.x;
        positionArray[i * dimensions + 1] = element.position.y;
        positionArray[i * dimensions + 2] = element.position.z;
        positionArray[i * dimensions + 3] = element.position.w;

        positionArray[i * dimensions + 8] = element.particleType.id;
    };
    return positionArray;
}

export function createTypesArray(types: Map<ParticleType, Force[]>) {
    let dimensions = 8;
    let typesArray = new Float32Array(types.size * dimensions);

    let index = 0;
    types.forEach((value, key) => {
        typesArray[index * dimensions + 0] = key.color.x;
        typesArray[index * dimensions + 1] = key.color.y;
        typesArray[index * dimensions + 2] = key.color.z;
        typesArray[index * dimensions + 3] = key.color.w;

        typesArray[index * dimensions + 4] = key.id;
        typesArray[index * dimensions + 5] = key.radius;

        index++;
    });
    return typesArray;
}

export function createForcesArray(types: Map<ParticleType, Force[]>) {
    let dimensions = 3;
    const flattenedValues = Array.from(types.values()).flat();
    let forceArray = new Float32Array(flattenedValues.length * dimensions);

    let index = 0;
    types.forEach((value, key) => {
        value.forEach(force => {
            forceArray[index * dimensions + 0] = force.particleA.id;
            forceArray[index * dimensions + 1] = force.particleB.id;
            forceArray[index * dimensions + 2] = force.force;
            
            index++;
        })
    });

    return forceArray;
}