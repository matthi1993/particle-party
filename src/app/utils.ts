import { ParticleType, Point } from './model/Point'
import { PhysicsData } from './model/Simulation';

export function randomRounded(from: number, to: number): number {
    return Math.round((Math.random() * (to - from) + from) * 100) / 100;
}

export function createArraysFromPoints(points: Point[], physicsData: PhysicsData) {
    let dimensions = 12;
    let positionArray = new Float32Array(points.length * dimensions);

    for (let index = 0; index < points.length; index++) {
        const element = points[index];

        positionArray[index * dimensions] = element.position[0];
        positionArray[index * dimensions + 1] = element.position[1];
        positionArray[index * dimensions + 2] = element.position[2];
        positionArray[index * dimensions + 3] = element.position[3];

        positionArray[index * dimensions + 8] = physicsData.types.indexOf(element.particleType);
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

        typesArray[index * dimensions + 4] = index;
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