import {Component, Input} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {DataStore} from "../../store/data.store";
import {DataService} from "../../services/data.service";
import {SliderModule} from 'primeng/slider';
import {ButtonModule} from 'primeng/button';
import {FieldsetModule} from 'primeng/fieldset';
import {ChipModule} from 'primeng/chip';
import {ParticleSimulation} from "../../../scene/particle-simulation";
import {Brush, BrushState} from "../../model/Brush";

@Component({
    selector: 'app-simulation-edit',
    imports: [CommonModule, ButtonModule, FieldsetModule, ChipModule, SliderModule, FormsModule],
    templateUrl: './simulation-edit.component.html',
    styleUrl: './simulation-edit.component.scss'
})
export class SimulationEditComponent {

    @Input() public scene!: ParticleSimulation;
    @Input() public brush!: Brush;

    public BrushState = BrushState; // Make enum available in template

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
} 