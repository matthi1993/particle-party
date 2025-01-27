
import { mat4, vec3 } from 'gl-matrix';


export class Camera {

    viewProjectionMatrix = mat4.create();

    position = vec3.fromValues(0, 0, 10);    // Camera position
    center = vec3.fromValues(0, 0, 0); // Look-at point
    up = vec3.fromValues(0, 1, 0);     // Up vector

    viewMatrix = mat4.create();
    projectionMatrix = mat4.create();
    orthoMatrix = mat4.create();

    constructor(width: number, height: number, distance: number) {

        const fov = Math.PI / 4;
        const aspect = width / height;
        const near = 0.1;
        const far = 500.0;

        this.position = vec3.fromValues(0, 0, 20); 

        // Projection matrix
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
        mat4.ortho(this.orthoMatrix, -100, 100, -100, 100, near, far);
        // View matrix
        mat4.lookAt(this.viewMatrix, this.position, this.center, this.up);

        // Combine into a view-projection matrix
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }

    getViewProjectionMatrix() {
        return this.viewProjectionMatrix;
    }

    updateCamera() {
        // Create the view matrix (camera looking at the center)
        this.viewMatrix = mat4.create();
        mat4.lookAt(this.viewMatrix, this.position, this.center, this.up);
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }
}