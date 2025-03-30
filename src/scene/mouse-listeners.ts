import {getMouseNDC} from "./scene.mousevent";

export class CameraMovementListeners {
    private isMouseDown = false;
    private mousePosX = 0;
    private mousePosY = 0;

    constructor(
        element: HTMLElement,
        play: () => void,
        moveCamera: (x: number, y: number, z: number) => void,
        mouseChange: (x: number, y: number) => void,
    ) {
        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                play();
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
                moveCamera(
                    -1 * (event.clientX - this.mousePosX),
                    (event.clientY - this.mousePosY),
                    0
                )
            }
            this.mousePosX = event.clientX;
            this.mousePosY = event.clientY;

            const ndc = getMouseNDC(event, element);
            mouseChange(ndc.x, ndc.y);
        });

        element.addEventListener('wheel', (event) => {
            event.preventDefault();
            moveCamera(
                0,
                0,
                event.deltaY
            );
        });
    }
}