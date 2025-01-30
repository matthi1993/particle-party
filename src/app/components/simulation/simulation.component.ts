import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PhysicsData } from 'src/app/model/Simulation';
import { SceneComponent } from '../scene/scene.component';
import { Point, create } from 'src/app/model/Point';
import { ELECTRON, NEUTRON, PROTON } from 'src/app/model/DefaultSimulationData';

@Component({
  selector: 'app-simulation',
  imports: [SceneComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit{

  @Input() public points!: Point[];
  @Input() public physicsData!: PhysicsData;

  public canvasWidth = 1000;
  public canvasHeight = 1000;

  @ViewChild(SceneComponent) scene!: SceneComponent;

  ngOnInit(): void {
  }

  public createEmptyWorld() {
    this.points = [];
    this.scene.createScene(this.points);
  }

  public createRandomWorld() {
    let newPoints:Point[] = [];
    this.physicsData.types.forEach(type => {
      console.log(type);
      newPoints.push(...create(300, type, 100));
    })
    this.points = newPoints;
    this.scene.createScene(this.points);
  }

  public onDataChange() {
    this.scene.createScene(this.points);
  }

  public onForcesChange() {
    this.scene.updateForcesAndTypes();
  }
}