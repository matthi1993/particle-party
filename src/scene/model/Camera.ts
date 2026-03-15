import { mat4, vec3, vec4 } from 'gl-matrix';


export class Camera {

    viewProjectionMatrix = mat4.create();

    minZoom = 30;
    maxZoom = 5000;

    /** Controls how fast the scroll wheel zooms. Higher = faster. Try 1–10. */
    ZOOM_SPEED = 1;

    position = vec3.fromValues(0, 0, 200);    // Camera position
    center = vec3.fromValues(0, 0, 0);         // Look-at point
    up = vec3.fromValues(0, 1, 0);             // Up vector

    viewMatrix = mat4.create();
    projectionMatrix = mat4.create();
    orthoMatrix = mat4.create();

    constructor(width: number, height: number, distance: number) {

        const fov = Math.PI / 4;
        const aspect = width / height;
        const near = 0.1;
        const far = 10000.0;

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

    /** Returns the distance from camera to the look-at target — used to scale movement speed. */
    getZoomDistance(): number {
        return vec3.distance(this.position, this.center);
    }

    /**
     * Pan the camera in the right/up plane, and zoom along the forward axis.
     * `rightNorm` and `upNorm` are expected to be normalised mouse deltas (pixels / element size),
     * so the caller doesn't need to know about zoom — we scale here.
     */
    translate(rightNorm: number, upNorm: number, forwardNorm: number) {
        const zoomDist = this.getZoomDistance();

        // Pan speed scales linearly with zoom distance so close-up = subtle, far away = fast
        const panScale = zoomDist * 1.5;

        const forward = vec3.create();
        vec3.subtract(forward, this.center, this.position);
        vec3.normalize(forward, forward);

        const right = vec3.create();
        vec3.cross(right, forward, this.up);
        vec3.normalize(right, right);

        const up = vec3.clone(this.up);

        const movement = vec3.create();
        vec3.scaleAndAdd(movement, movement, right, rightNorm * panScale);
        vec3.scaleAndAdd(movement, movement, up, upNorm * panScale);

        // For zoom (forward) we use exponential scaling: multiply distance by a factor
        // forwardNorm is positive => zoom in, negative => zoom out
        if (Math.abs(forwardNorm) > 0.0001) {
            const zoomFactor = Math.pow(1 + 0.01 * this.ZOOM_SPEED, -forwardNorm * 100);
            const newDist = Math.max(this.minZoom, Math.min(this.maxZoom, zoomDist * zoomFactor));
            const ratio = newDist / zoomDist;

            // Scale the offset from center
            const offset = vec3.create();
            vec3.subtract(offset, this.position, this.center);
            vec3.scale(offset, offset, ratio);
            vec3.add(this.position, this.center, offset);
        }

        // Apply pan
        vec3.add(this.position, this.position, movement);
        vec3.add(this.center, this.center, movement);

        this.updateCamera();
    }

    /**
     * Zoom toward a specific NDC point (cursor position).
     * `ndcX`, `ndcY` are the cursor position in normalised device coordinates [-1, 1].
     * `delta` is the raw wheel deltaY.
     */
    zoomTowardCursor(ndcX: number, ndcY: number, delta: number, shiftHeld: boolean) {
        const zoomDist = this.getZoomDistance();

        // Finer control when shift is held
        const shiftMultiplier = shiftHeld ? 0.3 : 1.0;
        const zoomFactor = Math.pow(1 + 0.01 * this.ZOOM_SPEED, delta * 100 * shiftMultiplier);
        const newDist = Math.max(this.minZoom, Math.min(this.maxZoom, zoomDist * zoomFactor));

        if (Math.abs(newDist - zoomDist) < 0.001) return;

        const ratio = newDist / zoomDist;

        // --- zoom: scale the camera–center offset ---
        const offset = vec3.create();
        vec3.subtract(offset, this.position, this.center);
        vec3.scale(offset, offset, ratio);
        vec3.add(this.position, this.center, offset);

        // --- pan toward cursor so the point under the cursor stays fixed ---
        const forward = vec3.create();
        vec3.subtract(forward, this.center, this.position);
        vec3.normalize(forward, forward);

        const right = vec3.create();
        vec3.cross(right, forward, this.up);
        vec3.normalize(right, right);

        const up = vec3.clone(this.up);

        // The amount the world shifts under the cursor due to the zoom
        const panCompensation = (1 - ratio) * zoomDist;
        const panX = ndcX * panCompensation * 0.8;
        const panY = ndcY * panCompensation * 0.8;

        const panMovement = vec3.create();
        vec3.scaleAndAdd(panMovement, panMovement, right, panX);
        vec3.scaleAndAdd(panMovement, panMovement, up, panY);

        vec3.add(this.position, this.position, panMovement);
        vec3.add(this.center, this.center, panMovement);

        this.updateCamera();
    }

    orbit(yawNorm: number, pitchNorm: number) {
        // Speed scales so orbit feels consistent regardless of viewport
        const speed = 3.0;

        const rotation = mat4.create();
        mat4.rotateY(rotation, rotation, -yawNorm * speed);
        mat4.rotateX(rotation, rotation, -pitchNorm * speed);

        const direction = vec3.create();
        vec3.subtract(direction, this.position, this.center);
        vec3.transformMat4(direction, direction, rotation);

        vec3.add(this.position, this.center, direction);

        this.updateCamera();
    }

    updateCamera() {
        this.viewMatrix = mat4.create();
        mat4.lookAt(
            this.viewMatrix, 
            this.position, 
            this.center,
            this.up
        );
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }
}