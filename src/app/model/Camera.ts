
import { mat4, vec3 } from 'gl-matrix';


export class Camera {

    viewProjectionMatrix = mat4.create();

    public cameraAngle = 0; // Current angle of rotation
    cameraRadius = 30; // Distance from the scene center
    rotationSpeed = 0.01; // Speed of rotation (radians per frame)

    eye = vec3.fromValues(0, 0, 0);    // Camera position
    center = vec3.fromValues(0, 0, 0); // Look-at point
    up = vec3.fromValues(0, 1, 0);     // Up vector

    viewMatrix = mat4.create();
    projectionMatrix = mat4.create();

    constructor(width: number, height: number) {

        const fov = Math.PI / 4;
        const aspect = width / height;
        const near = 0.1;
        const far = 100.0;

        // Projection matrix
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
        // View matrix
        mat4.lookAt(this.viewMatrix, this.eye, this.center, this.up);

        // Combine into a view-projection matrix
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }

    getViewProjectionMatrix() {
        return this.viewProjectionMatrix;
    }

    updateCamera() {

        // Calculate the new camera position
        this.eye = [
            this.cameraRadius * Math.cos(this.cameraAngle), // X-coordinate
            0,                                   // Y-coordinate (height of the camera)
            this.cameraRadius * Math.sin(this.cameraAngle) // Z-coordinate
        ];

        // Create the view matrix (camera looking at the center)
        this.viewMatrix = mat4.create();
        mat4.lookAt(this.viewMatrix, this.eye, this.center, this.up);
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }
}