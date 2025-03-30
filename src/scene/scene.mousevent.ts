import { mat4, vec3 } from 'gl-matrix';  // If you're using the gl-matrix library
import { Camera } from 'src/scene/model/Camera';

export function getMouseNDC(event: MouseEvent, element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    return { x, y };
}

export function ndcToWorld(ndc: { x: number; y: number }, camera: Camera, z: number = 0): vec3 {
    // Create a 4D point with NDC x, y, and z
    const ndcPoint = vec3.fromValues(ndc.x, ndc.y, z);

    // Initialize the inverse matrices
    let inverseProjection = mat4.create();
    let inverseView = mat4.create();

    // Get the inverse projection and view matrices
    mat4.invert(inverseProjection, camera.projectionMatrix);
    mat4.invert(inverseView, camera.viewMatrix);

    // Transform NDC to camera space
    let cameraSpacePoint = vec3.create();
    vec3.transformMat4(cameraSpacePoint, ndcPoint, inverseProjection);

    // Transform to world space
    let worldPoint = vec3.create();
    vec3.transformMat4(worldPoint, cameraSpacePoint, inverseView);

    // Return the point in 3D world space (no need to divide by w, as we use vec3)
    return worldPoint;
}

export function projectToScenePlane(worldPoint: vec3, camera: Camera): vec3 {
    const cameraPosition = camera.position;
    const direction = vec3.create();
    vec3.sub(direction, worldPoint, cameraPosition);

    // Calculate t for intersection with z = 0 plane
    const t = -cameraPosition[2] / direction[2];

    // Project onto the z = 0 plane
    const scenePoint = vec3.create();
    vec3.scaleAndAdd(scenePoint, cameraPosition, direction, t);
    scenePoint[2] = 0;  // Ensure the z position is exactly 0

    return scenePoint;
}