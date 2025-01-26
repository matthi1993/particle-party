import { Component, Input } from '@angular/core';
import { ControlsComponent } from "../controls/controls.component";
import { SimulationData } from 'src/app/model/Simulation';

@Component({
  selector: 'app-physics',
  imports: [ControlsComponent],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.scss'
})
export class PhysicsComponent {

  @Input() public simulationData!: SimulationData;

}
