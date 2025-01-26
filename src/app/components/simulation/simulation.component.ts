import { Component, Input, ViewChild } from '@angular/core';
import { PhysicsData, SimulationData } from 'src/app/model/Simulation';
import { SceneComponent } from '../scene/scene.component';
import { Point, create } from 'src/app/model/Point';
import { NEUTRON, PROTON } from 'src/app/model/DefaultSimulationData';

@Component({
  selector: 'app-simulation',
  imports: [SceneComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss'],
})
export class SimulationComponent {

  @Input() public points: Point[] = [
    ...create(100, PROTON, 1000),
    ...create(100, NEUTRON, 1000)
  ];
  @Input() public physicsData!: PhysicsData;

  @ViewChild(SceneComponent) scene!: SceneComponent;

  public onDataChange() {
    this.scene.recreateScene();
  }

  public onForcesChange() {
    this.scene.updateForcesAndTypes();
  }
}