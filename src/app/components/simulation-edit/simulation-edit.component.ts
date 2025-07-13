import {Component, Input} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {DataStore} from "../../store/data.store";
import {DataService} from "../../services/data.service";
import {SliderModule} from 'primeng/slider';
import {ButtonModule} from 'primeng/button';
import {FieldsetModule} from 'primeng/fieldset';
import {ChipModule} from 'primeng/chip';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {ParticleSimulation} from "../../../scene/particle-simulation";
import {Brush, BrushState} from "../../model/Brush";
import {Structure} from "../../../scene/model/Structure";
import {Point} from "../../../scene/model/Point";
import {vec4} from 'gl-matrix';

@Component({
    selector: 'app-simulation-edit',
    imports: [CommonModule, ButtonModule, FieldsetModule, ChipModule, SliderModule, FormsModule, DialogModule, InputTextModule],
    templateUrl: './simulation-edit.component.html',
    styleUrl: './simulation-edit.component.scss'
})
export class SimulationEditComponent {

    @Input() public scene!: ParticleSimulation;
    @Input() public brush!: Brush;

    public BrushState = BrushState; // Make enum available in template
    public showSaveDialog = false;
    public structureName = '';

    constructor(public dataStore: DataStore, public dataService: DataService) {
    }

    public setBrushState(state: BrushState) {
        this.brush.state = state;
        if (state === BrushState.None) {
            // Reset all point selections when switching to None state
            this.scene.resetPointSelection();
        }
    }

    public selectParticle(index: number) {
        this.brush.particleId = index;
        this.brush.structureId = -1; // Deselect structure
    }

    public selectStructure(index: number) {
        this.brush.structureId = index;
        this.brush.particleId = -1; // Deselect particle
    }

    public async getSelectedPointsCount(): Promise<number> {
        const currentPoints = await this.scene.getCurrentPoints();
        return currentPoints.filter(point => point.selected === 1).length;
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