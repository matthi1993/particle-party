import {getMouseNDC} from "./scene.mousevent";

export class CameraMovementListeners {
    private isMouseDown = false;
    private isShiftDown = false;
    private isAltDown = false;
    private mousePosX = 0;
    private mousePosY = 0;

    // Inertia state
    private velocityX = 0;
    private velocityY = 0;
    private velocityOrbitX = 0;
    private velocityOrbitY = 0;
    private readonly damping = 0.88; // how quickly inertia decays (0 = instant stop, 1 = never stops)
    private animFrameId: number | null = null;

    // Track the last known NDC cursor position for zoom-toward-cursor
    private cursorNdcX = 0;
    private cursorNdcY = 0;

    constructor(
        element: HTMLElement,
        play: () => void,
        moveCamera: (x: number, y: number, z: number) => void,
        orbitCamera: (x: number, y: number) => void,
        mouseChange: (x: number, y: number) => void,
        private zoomTowardCursor?: (ndcX: number, ndcY: number, delta: number, shiftHeld: boolean) => void,
    ) {
        const elementWidth = () => element.clientWidth || 1;
        const elementHeight = () => element.clientHeight || 1;

        // ── Keyboard ──
        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                play();
            }
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isShiftDown = false;
            }
            if (event.code === 'AltLeft' || event.code === 'AltRight') {
                this.isAltDown = false;
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isShiftDown = true;
            }
            if (event.code === 'AltLeft' || event.code === 'AltRight') {
                this.isAltDown = true;
            }
        });

        // ── Mouse button ──
        element.addEventListener('mousedown', (_event) => {
            this.isMouseDown = true;
            // Kill inertia on new grab
            this.velocityX = 0;
            this.velocityY = 0;
            this.velocityOrbitX = 0;
            this.velocityOrbitY = 0;
        });
        element.addEventListener('mouseup', (_event) => {
            this.isMouseDown = false;
            // Start inertia coast
            this.startInertia(moveCamera, orbitCamera);
        });

        // ── Mouse move ──
        element.addEventListener('mousemove', (event) => {
            event.preventDefault();

            // Normalise pixel delta by element size so behaviour is resolution-independent
            const dx = (event.clientX - this.mousePosX) / elementWidth();
            const dy = (event.clientY - this.mousePosY) / elementHeight();

            if (this.isMouseDown) {
                if (this.isAltDown) {
                    // Orbit
                    orbitCamera(dx, dy);
                    this.velocityOrbitX = dx;
                    this.velocityOrbitY = dy;
                } else {
                    // Pan — pass normalised deltas; Camera.translate handles zoom-scaling
                    let shiftScale = this.isShiftDown ? 0.25 : 1;
                    const panX = -dx * shiftScale;
                    const panY = dy * shiftScale;
                    moveCamera(panX, panY, 0);
                    this.velocityX = panX;
                    this.velocityY = panY;
                }
            }

            this.mousePosX = event.clientX;
            this.mousePosY = event.clientY;

            const ndc = getMouseNDC(event, element);
            this.cursorNdcX = ndc.x;
            this.cursorNdcY = ndc.y;
            mouseChange(ndc.x, ndc.y);
        });

        // ── Wheel / scroll zoom ──
        element.addEventListener('wheel', (event) => {
            event.preventDefault();

            // Normalise deltaY (different browsers/trackpads give wildly different values)
            let delta = event.deltaY;
            // deltaMode 1 = lines, 2 = pages — normalise to pixels
            if (event.deltaMode === 1) delta *= 16;
            if (event.deltaMode === 2) delta *= 100;

            // Clamp to avoid huge jumps from trackpad flings
            delta = Math.max(-300, Math.min(300, delta));

            // Normalise to roughly -1…1 range
            const normDelta = delta / 300;

            if (this.zoomTowardCursor) {
                this.zoomTowardCursor(this.cursorNdcX, this.cursorNdcY, normDelta, this.isShiftDown);
            } else {
                // Fallback: plain forward zoom
                moveCamera(0, 0, normDelta);
            }
        });
    }

    /** Smoothly coast the camera after the mouse is released. */
    private startInertia(
        moveCamera: (x: number, y: number, z: number) => void,
        orbitCamera: (x: number, y: number) => void,
    ) {
        if (this.animFrameId !== null) return; // already running

        const tick = () => {
            const hasVelocity =
                Math.abs(this.velocityX) > 0.00001 ||
                Math.abs(this.velocityY) > 0.00001 ||
                Math.abs(this.velocityOrbitX) > 0.00001 ||
                Math.abs(this.velocityOrbitY) > 0.00001;

            if (!hasVelocity || this.isMouseDown) {
                this.animFrameId = null;
                return;
            }

            // Apply residual velocity
            if (Math.abs(this.velocityOrbitX) > 0.00001 || Math.abs(this.velocityOrbitY) > 0.00001) {
                orbitCamera(this.velocityOrbitX, this.velocityOrbitY);
            }
            if (Math.abs(this.velocityX) > 0.00001 || Math.abs(this.velocityY) > 0.00001) {
                moveCamera(this.velocityX, this.velocityY, 0);
            }

            // Decay
            this.velocityX *= this.damping;
            this.velocityY *= this.damping;
            this.velocityOrbitX *= this.damping;
            this.velocityOrbitY *= this.damping;

            this.animFrameId = requestAnimationFrame(tick);
        };

        this.animFrameId = requestAnimationFrame(tick);
    }
}