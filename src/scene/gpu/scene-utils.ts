import { ParticleType, Point } from '../model/Point'

export function createArraysFromPoints(points: Point[]) {
    let dimensions = 12;
    let positionArray = new Float32Array(points.length * dimensions);

    for (let index = 0; index < points.length; index++) {
        const element = points[index];

        // index 0 to 3 for positions
        positionArray[index * dimensions] = element.position[0];
        positionArray[index * dimensions + 1] = element.position[1];
        positionArray[index * dimensions + 2] = element.position[2];
        positionArray[index * dimensions + 3] = element.position[3];
        
        // index 4 to 7 are reserved for velocity

        positionArray[index * dimensions + 8] = element.particleTypeId;
        positionArray[index * dimensions + 9] = index; // global index of the Particle
        positionArray[index * dimensions + 10] = element.selected; // selected
    };
    return positionArray;
}

export function createTypesArray(types: ParticleType[]) {
    let dimensions = 8;
    let typesArray = new Float32Array(types.length * dimensions);

    let index = 0;
    types.forEach((key) => {
        typesArray[index * dimensions + 0] = key.color.r / 255;
        typesArray[index * dimensions + 1] = key.color.g / 255;
        typesArray[index * dimensions + 2] = key.color.b / 255;
        typesArray[index * dimensions + 3] = 1; // Alpha channel is always 1

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