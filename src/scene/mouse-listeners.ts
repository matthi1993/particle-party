import {getMouseNDC} from "./scene.mousevent";

export class CameraMovementListeners {
    private isMouseDown = false;
    private isShiftDown = false;
    private isAltDown = false;
    private mousePosX = 0;
    private mousePosY = 0;

    constructor(
        element: HTMLElement,
        play: () => void,
        moveCamera: (x: number, y: number, z: number) => void,
        orbitCamera: (x: number, y: number) => void,
        mouseChange: (x: number, y: number) => void,
    ) {
        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                play();
            }
            if (event.code === 'ShiftLeft') {
                this.isShiftDown = false;
            }
            if (event.code === 'AltLeft') {
                this.isAltDown = false;
            }
        });
        document.addEventListener('keydown', (event) => {
            console.log(event.code);
            if (event.code === 'ShiftLeft') {
                this.isShiftDown = true;
            }
            if (event.code === 'AltLeft') {
                this.isAltDown = true;
            }
        });
        element.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
        });
        element.addEventListener('mouseup', (event) => {
            this.isMouseDown = false;
        });

        element.addEventListener('mousemove', (event) => {
            event.preventDefault();
            if (this.isMouseDown) {
                if(this.isAltDown) {
                    orbitCamera(
                        (event.clientX - this.mousePosX),
                        (event.clientY - this.mousePosY),
                    )

                } else {
                    let speedMultiplier = 1;
                    if(this.isShiftDown) {
                        speedMultiplier = 0.1;
                    }

                    moveCamera(
                        -1 * (event.clientX - this.mousePosX) * speedMultiplier,
                        (event.clientY - this.mousePosY) * speedMultiplier,
                        0
                    )
                }
            }
            this.mousePosX = event.clientX;
            this.mousePosY = event.clientY;

            const ndc = getMouseNDC(event, element);
            mouseChange(ndc.x, ndc.y);
        });

        element.addEventListener('wheel', (event) => {
            event.preventDefault();

            let speedMultiplier = 1;
            if(this.isShiftDown) {
                speedMultiplier = 0.1;
            }

            moveCamera(
                0,
                0,
                event.deltaY * speedMultiplier
            );
        });
    }
}