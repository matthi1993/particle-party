import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {create} from 'src/scene/model/Point';
import {DataStore} from 'src/app/store/data.store';
import {FormsModule} from '@angular/forms';
import {ParticleSimulation} from 'src/scene/particle-simulation';
import {DataService} from 'src/app/services/data.service';
import {getMouseNDC, getPointNDC, ndcToWorld, projectToScenePlane} from "../../../scene/scene.mousevent";
import {Brush, BrushState} from "../../model/Brush";
import {MenuComponent} from "../menu/menu.component";
import {BrushComponent} from "../brush/brush.component";

@Component({
    selector: 'app-simulation',
    imports: [FormsModule, MenuComponent, BrushComponent],
    templateUrl: './simulation.component.html',
    styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

    @ViewChild('gpuCanvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;

    public scene: ParticleSimulation = new ParticleSimulation();
    public brush: Brush = new Brush();

    constructor(public dataStore: DataStore, public dataService: DataService) {
    }

    async ngOnInit() {
        this.dataService.listPhysicsModels().subscribe(physics => {
            this.dataStore.physicsDataOptions = physics;
        });
        this.dataService.listSimulationModels().subscribe(simulations => {
            this.dataStore.simulationData = simulations[0];

            let canvas = document.querySelector("canvas")!!;
            this.scene.setup(
                canvas,
                3000,
                3000,
            ).then(() => {
                this.scene.setScene(
                    this.dataStore.simulationData.physicsData,
                    this.dataStore.simulationData.points
                );
                let mouseDownX = 0;
                let mouseDownY = 0;
                canvas.addEventListener("mousedown", (e) => {
                    mouseDownX = e.clientX;
                    mouseDownY = e.clientY;
                });
                canvas.addEventListener("mouseup", (e) => {
                    if (e.clientX === mouseDownX && e.clientY === mouseDownY) {
                        let pos = getMouseNDC(e, canvas);
                        this.brushClicked(pos.x, pos.y);
                    }
                });
                this.scene.simulationLoop(true);
                this.scene.renderLoop(true);
            });
        })
    }

    public async brushClicked(x: number, y: number) {
        if (this.brush.state === BrushState.Paint) {
            let type = this.dataStore.simulationData.physicsData.types[this.brush.particleId];

            const camera = this.scene.getCamera()

            let radiusNDC = getPointNDC(this.brush.radius, 0, this.canvasRef.nativeElement);

            const originWorldPoint = ndcToWorld(x, y, camera);
            const originPoint = projectToScenePlane(originWorldPoint, camera);

            // TODO: This is not correct, radius needs to be in world space
            let radius = (radiusNDC.x + 1) * (camera.position[2]) / 2;

            await this.scene.addPointsToScene(
                originPoint[0],
                originPoint[1],
                create(this.brush.count, type, radius)
            );
        } else if (this.brush.state === BrushState.Select) {

            //TODO performance is bad for selection, needs to be done in shader, same for deselect
            const camera = this.scene.getCamera();
            
            // Convert brush radius to world space
            let radiusNDC = getPointNDC(this.brush.radius, 0, this.canvasRef.nativeElement);
            let radius = (radiusNDC.x + 1) * (camera.position[2]) / 2;
            
            // Get click position in world space
            const originWorldPoint = ndcToWorld(x, y, camera);
            const originPoint = projectToScenePlane(originWorldPoint, camera);
            
            // Get current points from the scene
            const currentPoints = await this.scene.getCurrentPoints();
            
            // Check which points are within the brush radius and set their selected flag
            currentPoints.forEach(point => {
                const distance = Math.sqrt(
                    Math.pow(point.position[0] - originPoint[0], 2) + 
                    Math.pow(point.position[1] - originPoint[1], 2)
                );
                
                if (distance <= radius) {
                    point.selected = 1;
                }
            });
            
            // Update the points in the scene
            await this.scene.updatePoints(currentPoints);
        }
    }

    public async resetPointSelection() {
        const currentPoints = await this.scene.getCurrentPoints();
        currentPoints.forEach(point => {
            point.selected = 0;
        });
        await this.scene.updatePoints(currentPoints);
    }
}
