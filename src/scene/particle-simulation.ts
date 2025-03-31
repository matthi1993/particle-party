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
    private RENDER_UPDATE_INTERVAL = 30;
    private SIMULATION_UPDATE_INTERVAL = 30;
    private simulateIntervalId: any = undefined;
    private renderIntervalId: any = undefined;

    private mousePos = vec3.fromValues(0, 0, 0);
    private selectionRadius = 0;

    public async setup(canvas: HTMLCanvasElement, width: number, height: number) {
        this.gpuContext = new GpuContext(canvas, width, height);
        this.camera = new Camera(width, height, 50);
        await this.gpuContext.setup();

        // set Camera Movement Listeners
        new CameraMovementListeners(
            this.gpuContext.canvas!!,
            () => this.simulationLoop(!this.isPlaying),
            (x: number, y: number, z: number) => {
                this.camera.position[0] += x * this.camera.position[2] / this.camera.moveSpeed;
                this.camera.position[1] += y * this.camera.position[2] / this.camera.moveSpeed;
                this.camera.position[2] += z * this.camera.position[2] / this.camera.moveSpeed;

                this.camera.position[2] = Math.min(Math.max(this.camera.position[2], this.camera.minZoom), this.camera.maxZoom);
            },
            (x: number, y: number) => {
                const worldPoint = ndcToWorld(x, y, this.camera);
                this.mousePos = projectToScenePlane(worldPoint, this.camera);
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

    public updateSelectinoRadius(radius: number) {
        // todo
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
    }

    public async updatePoints(points: Point[]) {
        this.points = points;
        this.sceneStorage.updatePointValues(this.gpuContext, this.points, this.physicsData);
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
            }, this.SIMULATION_UPDATE_INTERVAL);
        } else if (this.simulateIntervalId) {
            clearInterval(this.simulateIntervalId);
            this.simulateIntervalId = undefined;
        }
    }

    public renderLoop(shouldPlay: boolean) {
        if (shouldPlay && !this.renderIntervalId) {
            this.renderIntervalId = setInterval(() => {
                this.render();
            }, this.RENDER_UPDATE_INTERVAL);
        } else if (this.renderIntervalId) {
            clearInterval(this.renderIntervalId);
            this.renderIntervalId = undefined;
        }
    }

    async addPointsToScene(originX: number, originY: number, points: Point[]) {
        let shouldPlay = this.isPlaying;
        this.simulationLoop(false);
        this.renderLoop(false)

        // adding a timeout to make sure no simulation loop is called in between
        setTimeout(async () => {
            this.points = await this.getCurrentPoints();
            const worldPoint = ndcToWorld(originX, originY, this.camera);
            const scenePoint = projectToScenePlane(worldPoint, this.camera);

            let pointsToAdd: Point[] = [];
            points.forEach(point => {
                pointsToAdd.push(new Point(
                    vec4.fromValues(
                        scenePoint[0] + point.position[0],
                        scenePoint[1] + point.position[1],
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
        }, this.SIMULATION_UPDATE_INTERVAL)
    }

    render() {
        // update buffers
        this.camera.updateCamera();
        this.sceneStorage.updateRenderUniformsBuffer(
            this.gpuContext,
            this.camera,
            this.mousePos[0],
            this.mousePos[1],
            this.selectionRadius
        );

        // setup render pipelines
        const encoder = this.gpuContext.device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.gpuContext.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: BACKGROUND_COLOR,
                storeOp: "store",
            }]
        });

        this.simulationRenderer?.execute(
            renderPass,
            this.step,
            this.points.length
        );

        renderPass.end();
        this.gpuContext.device.queue.submit([encoder.finish()]);
    }

    simulate() {
        const encoder = this.gpuContext.device.createCommandEncoder();
        this.simulationCompute?.execute(encoder, this.step, this.points.length);
        this.step++;
        this.gpuContext.device.queue.submit([encoder.finish()]);
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