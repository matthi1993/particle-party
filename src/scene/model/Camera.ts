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

    /** Camera right vector (extracted from the view matrix). */
    getCameraRight(): vec3 {
        return vec3.fromValues(this.viewMatrix[0], this.viewMatrix[4], this.viewMatrix[8]);
    }

    /** Camera up vector (extracted from the view matrix). */
    getCameraUp(): vec3 {
        return vec3.fromValues(this.viewMatrix[1], this.viewMatrix[5], this.viewMatrix[9]);
    }

    /** Unproject an NDC point to a world-space ray direction from the camera. */
    private ndcToWorldRay(ndcX: number, ndcY: number): vec3 {
        const invProj = mat4.create();
        mat4.invert(invProj, this.projectionMatrix);
        const invView = mat4.create();
        mat4.invert(invView, this.viewMatrix);

        // Point in clip space at near plane
        const clipPoint = vec4.fromValues(ndcX, ndcY, -1, 1);
        const eyePoint = vec4.create();
        vec4.transformMat4(eyePoint, clipPoint, invProj);
        // We want a direction, not a point
        eyePoint[2] = -1;
        eyePoint[3] = 0;

        const worldDir = vec4.create();
        vec4.transformMat4(worldDir, eyePoint, invView);
        const dir = vec3.fromValues(worldDir[0], worldDir[1], worldDir[2]);
        vec3.normalize(dir, dir);
        return dir;
    }

    /** Find world point where a ray from camera through NDC (x,y) hits the plane at distance=zoomDist from camera along the forward axis. */
    private ndcToWorldPoint(ndcX: number, ndcY: number): vec3 {
        const ray = this.ndcToWorldRay(ndcX, ndcY);
        const forward = vec3.create();
        vec3.subtract(forward, this.center, this.position);
        const dist = vec3.length(forward);
        vec3.normalize(forward, forward);

        // Intersect with the plane perpendicular to forward, passing through center
        const denom = vec3.dot(ray, forward);
        if (Math.abs(denom) < 0.0001) {
            return vec3.clone(this.center);
        }
        const t = dist / denom;
        const worldPoint = vec3.create();
        vec3.scaleAndAdd(worldPoint, this.position, ray, t);
        return worldPoint;
    }

    /**
     * Pan the camera in the right/up plane, and zoom along the forward axis.
     */
    translate(rightNorm: number, upNorm: number, forwardNorm: number) {
        const zoomDist = this.getZoomDistance();
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

        if (Math.abs(forwardNorm) > 0.0001) {
            const zoomFactor = Math.pow(1 + 0.01 * this.ZOOM_SPEED, -forwardNorm * 100);
            const newDist = Math.max(this.minZoom, Math.min(this.maxZoom, zoomDist * zoomFactor));
            const ratio = newDist / zoomDist;

            const offset = vec3.create();
            vec3.subtract(offset, this.position, this.center);
            vec3.scale(offset, offset, ratio);
            vec3.add(this.position, this.center, offset);
        }

        vec3.add(this.position, this.position, movement);
        vec3.add(this.center, this.center, movement);

        this.updateCamera();
    }

    /**
     * Zoom toward a specific NDC point (cursor position).
     * Uses proper unprojection so the world point under the cursor stays fixed.
     */
    zoomTowardCursor(ndcX: number, ndcY: number, delta: number, shiftHeld: boolean) {
        // Find the world point under the cursor BEFORE zooming
        const worldPointBefore = this.ndcToWorldPoint(ndcX, ndcY);

        const zoomDist = this.getZoomDistance();
        const shiftMultiplier = shiftHeld ? 0.3 : 1.0;
        const zoomFactor = Math.pow(1 + 0.01 * this.ZOOM_SPEED, delta * 100 * shiftMultiplier);
        const newDist = Math.max(this.minZoom, Math.min(this.maxZoom, zoomDist * zoomFactor));

        if (Math.abs(newDist - zoomDist) < 0.001) return;

        const ratio = newDist / zoomDist;

        // Scale the camera–center offset to zoom
        const offset = vec3.create();
        vec3.subtract(offset, this.position, this.center);
        vec3.scale(offset, offset, ratio);
        vec3.add(this.position, this.center, offset);

        // Rebuild the view matrix so we can unproject again
        this.updateCamera();

        // Find the world point under the cursor AFTER zooming
        const worldPointAfter = this.ndcToWorldPoint(ndcX, ndcY);

        // Shift the camera so the point under the cursor stays in the same place
        const correction = vec3.create();
        vec3.subtract(correction, worldPointBefore, worldPointAfter);

        vec3.add(this.position, this.position, correction);
        vec3.add(this.center, this.center, correction);

        this.updateCamera();
    }

    orbit(yawNorm: number, pitchNorm: number) {
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