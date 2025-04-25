import {Component, OnInit} from '@angular/core';
import {create, ParticleType} from 'src/scene/model/Point';
import {DataStore} from 'src/app/store/data.store';
import {FormsModule} from '@angular/forms';
import {ParticleSimulation} from 'src/scene/particle-simulation';
import {DataService} from 'src/app/services/data.service';
import {getMouseNDC} from "../../../scene/scene.mousevent";
import {Brush} from "../../model/Brush";
import {MenuComponent} from "../menu/menu.component";

@Component({
    selector: 'app-simulation',
    imports: [FormsModule, MenuComponent],
    templateUrl: './simulation.component.html',
    styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

    public scene: ParticleSimulation = new ParticleSimulation();
    public brush: Brush = new Brush();

    public selectedType: ParticleType | undefined = undefined;

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

    public typeChanged(type: ParticleType) {
        this.selectedType = type;
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }
}
