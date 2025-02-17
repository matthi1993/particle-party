import { Component, OnInit, ViewChild } from '@angular/core';
import { SceneComponent } from '../scene/scene.component';
import { Point, create } from 'src/app/model/Point';
import { DataStore } from 'src/app/store/data.store';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-simulation',
  imports: [FormsModule, MatInputModule, MatFormFieldModule, SceneComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  public canvasWidth = 800;
  public canvasHeight = 500;

  public pointPerType: number[] = [];

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
      newPoints.push(...create(this.pointPerType[index], type, 400));
    })
    this.dataStore.simulationData.points = newPoints;
    this.scene.createScene(this.dataStore.simulationData.points);
  }
}