import {Component, OnInit} from '@angular/core';
import {Point, create, ParticleType} from 'src/scene/model/Point';
import {DataStore} from 'src/app/store/data.store';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {PhysicsComponent} from "../physics/physics.component";
import {ParticleSimulation} from 'src/scene/particle-simulation';
import {randomRounded} from '../utils/utils';
import {vec4} from 'gl-matrix';
import {DataService} from 'src/app/services/data.service';
import {Brush, BrushComponent} from "../brush/brush.component";
import {getMouseNDC} from "../../../scene/scene.mousevent";

@Component({
    selector: 'app-simulation',
    imports: [FormsModule, MatInputModule, MatFormFieldModule, PhysicsComponent, BrushComponent],
    templateUrl: './simulation.component.html',
    styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

    public scene: ParticleSimulation = new ParticleSimulation();

    public brush: Brush = new Brush();
    public selectedType: ParticleType | undefined = undefined;
    public pointNumber: number = 500;

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
                canvas.addEventListener("mousemove", (e) => {
                    this.brush.x = e.clientX;
                    this.brush.y = e.clientY;
                })
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
        let type = this.dataStore.simulationData.physicsData.types[0];
        if (this.selectedType) {
            type = this.selectedType;
        }
        await this.scene.addPointsToScene(x, y, create(this.brush.count, type, this.brush.radius / 10));
    }

    public brushChanged() {
        this.scene.updateSelectinoRadius(this.brush.radius);
    }

    public createEmptyWorld() {
        this.dataStore.simulationData.points = [];
        this.scene.setScene(
            this.dataStore.simulationData.physicsData,
            this.dataStore.simulationData.points
        );
    }

    public createRandomWorld() {
        let newPoints: Point[] = [];
        this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
            console.log(type.id);
            newPoints.push(...create(this.pointNumber, type, 200));
        })
        this.dataStore.simulationData.points = newPoints;

        this.scene.setScene(
            this.dataStore.simulationData.physicsData,
            this.dataStore.simulationData.points
        );
    }

    randomForces() {
        this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
            type.radius = randomRounded(0, 50);
            type.mass = randomRounded(0, 0.25);
            type.size = randomRounded(0.5, 1)
            type.color = vec4.fromValues(
                randomRounded(0, 1),
                randomRounded(0, 1),
                randomRounded(0, 1),
                1
            )

            this.dataStore.simulationData.physicsData.types.forEach((col, colIndex) => {
                this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] = randomRounded(-0.5, 0.5);
            })
        });

        // update scene values
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }

    multiplyForces(factor: number) {
        this.dataStore.simulationData.physicsData.forces.forEach((row, rowIndex) => {
            row.forEach((col, colIndex) => {
                this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] *= factor;
            })
        })

        // update scene values
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }

    async saveSimulation() {
        const sim = this.dataStore.simulationData;
        sim.points = await this.scene.getCurrentPoints();
        await this.dataService.saveSimulation(sim);
    }

    public typeChanged(type: ParticleType) {
        this.selectedType = type;
    }
}
