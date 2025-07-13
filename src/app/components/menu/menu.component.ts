import {Component, Input} from '@angular/core';
import {TabsModule} from 'primeng/tabs';
import {FormsModule} from "@angular/forms";
import {Color, create, ParticleType, Point} from "../../../scene/model/Point";
import {randomRounded} from "../utils/utils";
import {DataStore} from "../../store/data.store";
import {DataService} from "../../services/data.service";
import {SliderModule} from 'primeng/slider';
import {InputNumberModule} from 'primeng/inputnumber';
import {FloatLabelModule} from 'primeng/floatlabel';
import {ParticleSimulation} from "../../../scene/particle-simulation";
import {ChipModule} from 'primeng/chip';
import {FileSelectEvent, FileUploadModule} from 'primeng/fileupload';
import {SimulationData} from "../../../scene/model/Simulation";
import {readFile} from "../utils/file-utils";
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {FieldsetModule} from 'primeng/fieldset';
import {ColorPickerModule} from 'primeng/colorpicker';
import {KnobModule} from 'primeng/knob';
import {TableModule} from 'primeng/table';
import {Brush, BrushState} from "../../model/Brush";
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SimulationEditComponent } from '../simulation-edit/simulation-edit.component';
import { DialogModule } from 'primeng/dialog';
import { Structure } from '../../../scene/model/Structure';
import { vec4 } from 'gl-matrix';

@Component({
    selector: 'app-menu',
    imports: [SimulationEditComponent, ToggleSwitchModule, TableModule, KnobModule, ColorPickerModule, FieldsetModule, InputTextModule, ButtonModule, FileUploadModule, ChipModule, TabsModule, FormsModule, SliderModule, InputNumberModule, FloatLabelModule, DialogModule],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent {

    @Input() public scene!: ParticleSimulation;
    @Input() public brush!: Brush;

    public pointNumber: number = 500;
    public BrushState = BrushState; // Make enum available in template
    public showSaveDialog = false;
    public structureName = '';

    public LIMITS = {
        MIN_FORCE: -1,
        MAX_FORCE: 1,
        MAX_RADIUS: 50,
        MAX_MASS: 0.25,
        MIN_SIZE: 0.25,
        MAX_SIZE: 1.25
    }

    constructor(public dataStore: DataStore, public dataService: DataService) {
    }

    public createRandomWorld() {
        let newPoints: Point[] = [];
        this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
            newPoints.push(...create(this.pointNumber, type, 200));
        })
        this.dataStore.simulationData.points = newPoints;

        this.scene.setScene(
            this.dataStore.simulationData.physicsData,
            this.dataStore.simulationData.points
        );
    }

    resetForces() {
        this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
            this.dataStore.simulationData.physicsData.types.forEach((col, colIndex) => {
                this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] = 0;
            })
        });

        // update scene values
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }

    randomForces() {
        this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
            this.dataStore.simulationData.physicsData.types.forEach((col, colIndex) => {
                this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] = randomRounded(this.LIMITS.MIN_FORCE, this.LIMITS.MAX_FORCE);
            })
        });

        // update scene values
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }

    randomParticleValues() {
        this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
            type.radius = randomRounded(0, this.LIMITS.MAX_RADIUS);
            type.mass = randomRounded(0, this.LIMITS.MAX_MASS);
            type.size = randomRounded(this.LIMITS.MIN_SIZE, this.LIMITS.MAX_SIZE)
            type.color = new Color(
                randomRounded(0, 255),
                randomRounded(0, 255),
                randomRounded(0, 255)
            )
        });

        // update scene values
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }

    multiplyForces(factor: number) {
        this.dataStore.simulationData.physicsData.forces.forEach((row, rowIndex) => {
            row.forEach((col, colIndex) => {
                this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] *= factor;
                this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] =
                    Math.max(
                        Math.min(
                            this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex],
                            this.LIMITS.MAX_FORCE
                        ),
                        this.LIMITS.MIN_FORCE
                    );
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

    async selectScene(event: FileSelectEvent) {
        this.dataStore.simulationData = await readFile<SimulationData>(event);
        this.scene.setScene(
            this.dataStore.simulationData.physicsData,
            this.dataStore.simulationData.points
        )
    }

    updatePhysics() {
        this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
    }

    addType() {
        let length = this.dataStore.simulationData.physicsData.types.length;
        let newType = new ParticleType(
            "Particle " + length,
            length,
            new Color(
                randomRounded(0, 255),
                randomRounded(0, 255),
                randomRounded(0, 255)
            ),
            randomRounded(0, this.LIMITS.MAX_RADIUS),
            randomRounded(this.LIMITS.MIN_SIZE, this.LIMITS.MAX_SIZE),
            randomRounded(0, this.LIMITS.MAX_MASS)
        );

        this.dataStore.simulationData.physicsData.types.push(newType);
        this.dataStore.simulationData.physicsData.forces.push(
            Array(this.dataStore.simulationData.physicsData.types.length).fill(0) //TODO, update all forces of all particles and set init value
        );
    }

    deleteType(index: number) {
        if (this.dataStore.simulationData.physicsData.types.length > 1) {
            this.dataStore.simulationData.physicsData.types.splice(index, 1)
            this.dataStore.simulationData.physicsData.forces.splice(index, 1);
            this.dataStore.simulationData.physicsData.forces.forEach(row => {
                row.splice(index, 1);
            })
        }

        // regenerate indices
        this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
            type.id = index;
        })
    }

    deleteStructure(index: number) {
        this.dataStore.simulationData.structures.splice(index, 1);
    }

    public async openSaveStructureDialog() {
        // Get current points from the scene
        const currentPoints = await this.scene.getCurrentPoints();
        
        // Filter only selected points
        const selectedPoints = currentPoints.filter(point => point.selected === 1);
        
        if (selectedPoints.length === 0) {
            alert('No points are selected. Please select some points first.');
            return;
        }
        
        // Set default name and show dialog
        this.structureName = `Structure ${this.dataStore.simulationData.structures.length + 1}`;
        this.showSaveDialog = true;
    }

    public async saveSelectedPointsAsStructure() {
        if (!this.structureName.trim()) {
            alert('Please enter a name for the structure.');
            return;
        }

        // Get current points from the scene
        const currentPoints = await this.scene.getCurrentPoints();
        
        // Filter only selected points
        const selectedPoints = currentPoints.filter(point => point.selected === 1);
        
        // Create a new structure
        const newStructure = new Structure();
        newStructure.name = this.structureName.trim();
        
        // Convert selected points to relative positions (centered around origin)
        const centerX = selectedPoints.reduce((sum, point) => sum + point.position[0], 0) / selectedPoints.length;
        const centerY = selectedPoints.reduce((sum, point) => sum + point.position[1], 0) / selectedPoints.length;
        
        newStructure.points = selectedPoints.map(point => {
            return new Point(
                vec4.fromValues(
                    point.position[0] - centerX,
                    point.position[1] - centerY,
                    point.position[2],
                    point.position[3]
                ),
                point.particleTypeId
            );
        });
        
        // Add the new structure to the simulation data
        this.dataStore.simulationData.structures.push(newStructure);
        
        // Reset point selection
        await this.scene.resetPointSelection();
        
        // Close dialog
        this.showSaveDialog = false;
        this.structureName = '';
    }

    public cancelSaveStructure() {
        this.showSaveDialog = false;
        this.structureName = '';
    }
}
