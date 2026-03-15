import {vec3, vec4} from "gl-matrix";
import {Compute} from "./gpu/gpu.compute";
import {GpuContext} from "./gpu/gpu.context";
import {Render} from "./gpu/gpu.render";
import {Camera} from "./model/Camera";
import {Point} from "./model/Point";
import {PhysicsData} from "./model/Simulation";
import {SceneStorage} from "./gpu/gpu.storage";
import {sceneComputeShader} from "./gpu/shader/sceneComputeShader";
import {Shape} from "./gpu/shapes/shapes";
import {SQUARE} from "./gpu/shapes/square";
import {ndcToWorld, projectToScenePlane} from "./scene.mousevent";
import {BACKGROUND_COLOR} from "./gpu/gpu-render-constants";
import {CameraMovementListeners} from "./mouse-listeners";

export class ParticleSimulation {
    private isPlaying = false;

    private physicsData!: PhysicsData;
    private points!: Point[];
    private camera!: Camera;

    private gpuContext!: GpuContext;
    private simulationCompute?: Compute;
    private simulationRenderer?: Render;
    private sceneStorage: SceneStorage = new SceneStorage();

    private step = 0;
    private _simulationInterval = 10;
    private _renderInterval = 30;
    private simulateIntervalId: any = undefined;
    private renderAnimFrameId: any = undefined;

    private mousePos = vec3.fromValues(0, 0, 0);
    private selectionRadius = 0;

    // Per-particle motion blur strength (configurable, 0 = off)
    public motionBlurStrength: number = 5.0;

    // 2D/3D mode
    public is3D: boolean = false;

    public async setup(canvas: HTMLCanvasElement, width: number, height: number) {
        this.gpuContext = new GpuContext(canvas, width, height);
        this.camera = new Camera(width, height, 250);
        await this.gpuContext.setup();

        // set Camera Movement Listeners
        new CameraMovementListeners(
            this.gpuContext.canvas!!,
            () => this.simulationLoop(!this.isPlaying),
            (x: number, y: number, z: number) => {
                this.camera.translate(x, y, z);
            },
            (x: number, y: number) => {
                this.camera.orbit(x, y);
            },
            (x: number, y: number) => {
                const worldPoint = ndcToWorld(x, y, this.camera);
                this.mousePos = projectToScenePlane(worldPoint, this.camera);
            },
            (ndcX: number, ndcY: number, delta: number, shiftHeld: boolean) => {
                this.camera.zoomTowardCursor(ndcX, ndcY, delta, shiftHeld);
            }
        );

        // Compute and Render Pipelines
        this.simulationCompute = new Compute(
            this.gpuContext.device,
            sceneComputeShader
        )
        this.simulationRenderer = new Render(
            this.gpuContext,
            new Shape(this.gpuContext.device, "Square Geometry", SQUARE)
        )

        // set buffers
        this.sceneStorage.createComputeUniformBuffer(this.gpuContext)
        this.sceneStorage.createRenderUniformBuffer(this.gpuContext, this.camera);
    }

    public getIsPlaying(): boolean {
        return this.isPlaying;
    }

    public setMotionBlurStrength(strength: number) {
        this.motionBlurStrength = Math.max(0, Math.min(strength, 20));
    }

    public get simulationInterval(): number {
        return this._simulationInterval;
    }

    public set simulationInterval(value: number) {
        const clamped = Math.max(1, Math.min(value, 1000));
        this._simulationInterval = clamped;
        // Restart simulation loop if currently playing
        if (this.isPlaying && this.simulateIntervalId) {
            clearInterval(this.simulateIntervalId);
            this.simulateIntervalId = undefined;
            this.simulationLoop(true);
        }
    }

    public get renderInterval(): number {
        return this._renderInterval;
    }

    public set renderInterval(value: number) {
        const clamped = Math.max(1, Math.min(value, 1000));
        this._renderInterval = clamped;
        // Restart render loop if currently running
        if (this.renderAnimFrameId) {
            clearInterval(this.renderAnimFrameId);
            this.renderAnimFrameId = undefined;
            this.renderLoop(true);
        }
    }

    public async toggleDimension() {
        const wasPlaying = this.isPlaying;
        this.simulationLoop(false);

        const currentPoints = await this.getCurrentPoints();
        const SCENE_SIZE = 200; // matches bounding sphere in compute shader

        if (this.is3D) {
            // Switching to 2D: flatten all z positions to 0, zero z velocity
            currentPoints.forEach(point => {
                point.position[2] = 0;
                point.velocity[2] = 0;
            });
            this.is3D = false;
        } else {
            // Switching to 3D: give random z positions within scene bounds
            currentPoints.forEach(point => {
                point.position[2] = (Math.random() * 2 - 1) * SCENE_SIZE * 0.5;
                point.velocity[2] = 0;
            });
            this.is3D = true;
        }

        this.points = currentPoints;
        this.step = 0;
        this.sceneStorage.updatePointValues(this.gpuContext, this.points, this.physicsData);
        this.updateBindGroups();

        if (wasPlaying) {
            this.simulationLoop(true);
        }
    }

    public setScene(physicsData: PhysicsData, points: Point[]) {
        this.step = 0;

        this.physicsData = physicsData;
        this.points = points;

        this.sceneStorage.createTypeStorage(this.gpuContext, this.physicsData);
        this.sceneStorage.createForceStorage(this.gpuContext, this.physicsData);

        this.sceneStorage.createReadStorage(this.gpuContext, this.points, this.physicsData);
        this.sceneStorage.createPointStorage(this.gpuContext, this.points, this.physicsData);

        this.updateBindGroups();
    }

    public updatePhysics(physicsData: PhysicsData) {
        this.physicsData = physicsData;
        this.sceneStorage.updateForceValues(this.gpuContext, this.physicsData);
        this.sceneStorage.updateTypeValues(this.gpuContext, this.physicsData);
        this.sceneStorage.updateComputeUniformsBuffer(this.gpuContext, this.physicsData);
    }

    public async updatePoints(points: Point[]) {
        this.points = points;
        this.sceneStorage.updatePointValues(this.gpuContext, this.points, this.physicsData);
    }

    public async resetPointSelection() {
        const currentPoints = await this.getCurrentPoints();
        currentPoints.forEach(point => {
            point.selected = 0;
        });
        await this.updatePoints(currentPoints);
    }

    public async deleteSelectedPoints() {
        const wasPlaying = this.isPlaying;
        this.simulationLoop(false);
        this.renderLoop(false);

        // Small delay to ensure no simulation loop is running


        const currentPoints = await this.getCurrentPoints();
        const remainingPoints = currentPoints.filter(point => point.selected !== 1);

        this.points = remainingPoints;
        this.step = 0;

        this.sceneStorage.createReadStorage(this.gpuContext, this.points, this.physicsData);
        this.sceneStorage.createPointStorage(this.gpuContext, this.points, this.physicsData);
        this.updateBindGroups();

        this.simulationLoop(wasPlaying);
        this.renderLoop(true);

        return remainingPoints;
    }

    private updateBindGroups() {
        if (this.simulationCompute) {
            this.simulationCompute.updateBindGroups(
                this.gpuContext.device,
                this.sceneStorage.positionsStorage,
                this.sceneStorage.typesStorage,
                this.sceneStorage.forcesStorage,
                this.sceneStorage.computeUniformsBuffer
            );
        }
        if (this.simulationRenderer) {
            this.simulationRenderer.updateBindGroups(
                this.gpuContext.device,
                this.sceneStorage.positionsStorage,
                this.sceneStorage.typesStorage,
                this.sceneStorage.renderUniformsBuffer,
                this.sceneStorage.selectionOutBuffer
            )
        }
    }

    public simulationLoop(shouldPlay: boolean) {
        this.isPlaying = shouldPlay;

        if (shouldPlay && !this.simulateIntervalId) {
            this.simulateIntervalId = setInterval(() => {
                this.simulate();
            }, this._simulationInterval);
        } else if (this.simulateIntervalId) {
            clearInterval(this.simulateIntervalId);
            this.simulateIntervalId = undefined;
        }
    }

    public renderLoop(shouldPlay: boolean) {
        if (shouldPlay && !this.renderAnimFrameId) {
            this.renderAnimFrameId = setInterval(() => {
                this.render();
            }, this._renderInterval);
        } else if (!shouldPlay && this.renderAnimFrameId) {
            clearInterval(this.renderAnimFrameId);
            this.renderAnimFrameId = undefined;
        }
    }

    async addPointsToScene(originX: number, originY: number, points: Point[]) {
        let shouldPlay = this.isPlaying;
        this.simulationLoop(false);
        this.renderLoop(false)

        // adding a timeout to make sure no simulation loop is called in between
        setTimeout(async () => {
            this.points = await this.getCurrentPoints();

            let pointsToAdd: Point[] = [];
            points.forEach(point => {
                pointsToAdd.push(new Point(
                    vec4.fromValues(
                        originX + point.position[0],
                        originY + point.position[1],
                        0,
                        1
                    ),
                    point.particleTypeId
                ));
            })

            this.points.push(...pointsToAdd);
            this.setScene(this.physicsData, this.points);

            this.simulationLoop(shouldPlay);
            this.renderLoop(true);
        }, this._simulationInterval)
    }

    render() {
        // update buffers
        this.camera.updateCamera();
        this.sceneStorage.updateRenderUniformsBuffer(
            this.gpuContext,
            this.camera,
            this.mousePos[0],
            this.mousePos[1],
            this.selectionRadius,
            this.motionBlurStrength
        );

        const encoder = this.gpuContext.device.createCommandEncoder();

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.gpuContext.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: BACKGROUND_COLOR,
                storeOp: "store",
            }],
        });

        if (this.points && this.points.length > 0) {
            this.simulationRenderer?.execute(
                renderPass,
                this.step,
                this.points.length
            );
        }

        renderPass.end();
        this.gpuContext.device.queue.submit([encoder.finish()]);
    }

    simulate() {
        if (!this.points || this.points.length === 0) return;
        const encoder = this.gpuContext.device.createCommandEncoder();
        this.simulationCompute?.execute(encoder, this.step, this.points.length);
        this.step++;
        this.gpuContext.device.queue.submit([encoder.finish()]);
    }

    getCamera() {
        return this.camera;
    }

    async getCurrentPoints(): Promise<Point[]> {
        let bufferIndex = this.step % 2;

        if (!this.points || this.points.length === 0) {
            return [];
        }

        const readBuffer = this.gpuContext.device.createBuffer({
            size: this.sceneStorage.positionsStorage!![bufferIndex].size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const commandEncoder = this.gpuContext.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(this.sceneStorage.positionsStorage!![bufferIndex], 0, readBuffer, 0, this.sceneStorage.positionsStorage!![bufferIndex].size);
        const commands = commandEncoder.finish();
        this.gpuContext.device.queue.submit([commands]);

        // Now, map the buffer to access the data
        await readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Float32Array(readBuffer.getMappedRange());
        this.points.forEach((point, index) => {
            point.position = vec4.fromValues(
                data[index * 12 + 0],
                data[index * 12 + 1],
                data[index * 12 + 2],
                data[index * 12 + 3],
            );
            point.velocity = vec4.fromValues(
                data[index * 12 + 4],
                data[index * 12 + 5],
                data[index * 12 + 6],
                data[index * 12 + 7],
            );
        })
        readBuffer.unmap();

        return this.points;
    }
}
