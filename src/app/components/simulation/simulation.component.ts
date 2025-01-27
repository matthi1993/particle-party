import { Component, Input, ViewChild } from '@angular/core';
import { PhysicsData } from 'src/app/model/Simulation';
import { SceneComponent } from '../scene/scene.component';
import { Point, create } from 'src/app/model/Point';
import { ELECTRON, NEUTRON, PROTON } from 'src/app/model/DefaultSimulationData';
import { vec4 } from 'gl-matrix';

@Component({
  selector: 'app-simulation',
  imports: [SceneComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss'],
})
export class SimulationComponent {

  @Input() public points: Point[] = [
    ...create(200, PROTON, 50),
    ...create(200, NEUTRON, 50),
    ...create(200, ELECTRON, 50)
  ];
  @Input() public physicsData!: PhysicsData;

  @ViewChild(SceneComponent) scene!: SceneComponent;

  public onDataChange() {
    this.scene.createScene();
  }

  public onForcesChange() {
    this.scene.updateForcesAndTypes();
  }
}