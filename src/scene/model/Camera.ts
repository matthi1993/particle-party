
import { mat4, vec3, vec4 } from 'gl-matrix';


export class Camera {

    viewProjectionMatrix = mat4.create();

    minZoom = 30;
    maxZoom = 1000;
    moveSpeed = 0.25;

    position = vec3.fromValues(0, 0, 200);    // Camera position
    center = vec3.fromValues(0, 0, 0); // Look-at point
    up = vec3.fromValues(0, 1, 0);     // Up vector

    viewMatrix = mat4.create();
    projectionMatrix = mat4.create();
    orthoMatrix = mat4.create();

    constructor(width: number, height: number, distance: number) {

        const fov = Math.PI / 4;
        const aspect = width / height;
        const near = 0.1;
        const far = 5000.0;

        this.position = vec3.fromValues(0, 0, distance); 

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

    translate(rightAmount: number, upAmount: number, forwardAmount: number) {

        const forward = vec3.create();
        vec3.subtract(forward, this.center, this.position);
        vec3.normalize(forward, forward);

        const right = vec3.create();
        vec3.cross(right, forward, this.up);
        vec3.normalize(right, right);

        const up = vec3.clone(this.up);

        const movement = vec3.create();
        vec3.scaleAndAdd(movement, movement, right, rightAmount * this.moveSpeed);
        vec3.scaleAndAdd(movement, movement, up, upAmount * this.moveSpeed);
        vec3.scaleAndAdd(movement, movement, forward, forwardAmount * this.moveSpeed * 2);

        vec3.add(this.position, this.position, movement);
        vec3.add(this.center, this.center, movement);

        this.updateCamera();
    }

    orbit(yaw: number, pitch: number) {

        let speedMultiplier = 0.01;

        // Convert the yaw and pitch into a rotation matrix
        const rotation = mat4.create();

        // Apply the yaw (rotation around the Y-axis)
        mat4.rotateY(rotation, rotation, -yaw * this.moveSpeed * speedMultiplier);

        // Apply the pitch (rotation around the X-axis)
        mat4.rotateX(rotation, rotation, -pitch * this.moveSpeed * speedMultiplier);

        // Calculate the direction vector from the camera to the center
        const direction = vec3.create();
        vec3.subtract(direction, this.position, this.center);

        // Rotate the direction vector by the rotation matrix
        vec3.transformMat4(direction, direction, rotation);

        // Update the camera position
        vec3.add(this.position, this.center, direction);

        // Update the camera to reflect the new position
        this.updateCamera();
    }



    updateCamera() {
        // Create the view matrix (camera looking at the center)
        this.viewMatrix = mat4.create();
        //mat4.lookAt(this.viewMatrix, this.position, this.center, this.up);
        
        // look forward
        mat4.lookAt(
            this.viewMatrix, 
            this.position, 
            this.center,
            this.up
        );
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }
}