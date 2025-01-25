import { Component, Input, ViewChild } from '@angular/core';
import { SimulationData } from 'src/app/model/Simulation';
import { SceneComponent } from '../scene/scene.component';
import { ControlsComponent } from "../controls/controls.component";

@Component({
  selector: 'app-simulation',
  imports: [SceneComponent, ControlsComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss'],
})
export class SimulationComponent {

  @Input() public simulationData!: SimulationData;

  @ViewChild(SceneComponent) scene!: SceneComponent;

  public onDataChange() {
    this.scene.recreateScene();
  }

  public onForcesChange() {
    this.scene.updateForcesAndTypes();
  }
}