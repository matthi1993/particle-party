import { Component, OnInit, ViewChild } from '@angular/core';
import { SceneComponent } from '../scene/scene.component';
import { Point, create } from 'src/app/components/scene/model/Point';
import { DataStore } from 'src/app/store/data.store';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ControlsComponent } from "../controls/controls.component";
import { PhysicsComponent } from "../physics/physics.component";

@Component({
  selector: 'app-simulation',
  imports: [FormsModule, MatInputModule, MatFormFieldModule, SceneComponent, ControlsComponent, PhysicsComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  public canvasWidth = 1500;
  public canvasHeight = 1500;

  public pointNumber: number = 500;

  @ViewChild(SceneComponent) scene!: SceneComponent;

  constructor(public dataStore: DataStore) {
  }

  ngOnInit(): void {
  }

  public createEmptyWorld() {
    this.dataStore.simulationData.points = [];
    this.scene.createScene(this.dataStore.simulationData.points);
  }

  public createRandomWorld() {
    let newPoints: Point[] = [];
    this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
      newPoints.push(...create(this.pointNumber, type, 300));
    })
    this.dataStore.simulationData.points = newPoints;
    this.scene.createScene(this.dataStore.simulationData.points);
  }
}