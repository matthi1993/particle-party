import { Force } from './components/controls/controls.component';
import { ParticleType, Point } from './model/Point'


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

export function createTypesArray(types: ParticleType[]) {
    let dimensions = 8;
    let typesArray = new Float32Array(types.length * dimensions);

    for (let i = 0; i < types.length; i++) {
        const element = types[i];

        typesArray[i * dimensions + 0] = element.color.x;
        typesArray[i * dimensions + 1] = element.color.y;
        typesArray[i * dimensions + 2] = element.color.z;
        typesArray[i * dimensions + 3] = element.color.w;

        typesArray[i * dimensions + 4] = element.id;
        typesArray[i * dimensions + 5] = element.radius;
    };
    return typesArray;
}

export function createForcesArray(forces: Force[]) {
    let dimensions = 3;
    let forceArray = new Float32Array(forces.length * dimensions);

    for (let i = 0; i < forces.length; i++) {
        const element = forces[i];

        forceArray[i * dimensions + 0] = element.particleA.id;
        forceArray[i * dimensions + 1] = element.particleB.id;
        forceArray[i * dimensions + 2] = element.force;
    };
    return forceArray;
}