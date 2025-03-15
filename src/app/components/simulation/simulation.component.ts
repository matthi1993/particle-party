import { Component, OnInit } from '@angular/core';
import { Point, create } from 'src/scene/model/Point';
import { DataStore } from 'src/app/store/data.store';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PhysicsComponent } from "../physics/physics.component";
import { Scene } from 'src/scene/scene';
import { randomRounded } from '../utils/utils';
import { vec4 } from 'gl-matrix';

@Component({
  selector: 'app-simulation',
  imports: [FormsModule, MatInputModule, MatFormFieldModule, PhysicsComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  public scene: Scene = new Scene();
  public pointNumber: number = 500;

  constructor(public dataStore: DataStore) {
  }

  async ngOnInit() {
    await this.scene.setup(
      document.querySelector("canvas")!!,
      1200,
      1200
    );
    this.scene.setPhysics(this.dataStore.simulationData.physicsData, true);
    this.scene.setPoints(this.dataStore.simulationData.points, true);

    this.scene.simulationLoop(true);
    this.scene.renderLoop(true);
  }

  public createEmptyWorld() {
    this.dataStore.simulationData.points = [];

    // update scene values
    this.scene.setPhysics(this.dataStore.simulationData.physicsData, true);
    this.scene.setPoints([], true);
  }

  public createRandomWorld() {
    let newPoints: Point[] = [];
    this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
      newPoints.push(...create(this.pointNumber, type, 300));
    })
    this.dataStore.simulationData.points = newPoints;

    // update scene values
    this.scene.setPhysics(this.dataStore.simulationData.physicsData, true);
    this.scene.setPoints(newPoints, true);
  }

  randomForces() {
    this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
      type.radius = randomRounded(0, 20);
      type.mass = randomRounded(0, 0.25);
      type.size = randomRounded(0.25, 2)
      type.color = vec4.fromValues(
        randomRounded(0, 1),
        randomRounded(0, 1),
        randomRounded(0, 1),
        1
      )

      this.dataStore.simulationData.physicsData.types.forEach((col, colIndex) => {
        this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] = randomRounded(-0.4, 0.4);
      })
    });

    // update scene values
    this.scene.setPhysics(this.dataStore.simulationData.physicsData, false);
  }

  multiplyForces(factor: number) {
    this.dataStore.simulationData.physicsData.forces.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] *= factor;
      })
    })

    // update scene values
    this.scene.setPhysics(this.dataStore.simulationData.physicsData, false);
  }
}
