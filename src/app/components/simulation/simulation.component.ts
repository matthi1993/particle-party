import { Component, Input, ViewChild } from '@angular/core';
import { PhysicsData } from 'src/app/model/Simulation';
import { SceneComponent } from '../scene/scene.component';
import { Point, create } from 'src/app/model/Point';
import { NEUTRON, PROTON } from 'src/app/model/DefaultSimulationData';
import { vec4 } from 'gl-matrix';

@Component({
  selector: 'app-simulation',
  imports: [SceneComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss'],
})
export class SimulationComponent {

  @Input() public points: Point[] = [
    new Point(vec4.fromValues(0,0,0,1), PROTON),
    new Point(vec4.fromValues(1,0,0,1), PROTON),
    new Point(vec4.fromValues(0,1,0,1), PROTON),
    new Point(vec4.fromValues(5,5,0,1), PROTON),
    new Point(vec4.fromValues(-5,-5,0,1), PROTON),
    new Point(vec4.fromValues(5,-5,0,1), PROTON),
    new Point(vec4.fromValues(-5,5,0,1), NEUTRON)
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