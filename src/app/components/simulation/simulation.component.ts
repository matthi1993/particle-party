import { Component, OnInit } from '@angular/core';
import { Point, create } from 'src/scene/model/Point';
import { DataStore } from 'src/app/store/data.store';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PhysicsComponent } from "../physics/physics.component";
import { ParticleSimulation } from 'src/scene/scene';
import { randomRounded } from '../utils/utils';
import { vec4 } from 'gl-matrix';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-simulation',
  imports: [FormsModule, MatInputModule, MatFormFieldModule, PhysicsComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  public scene: ParticleSimulation = new ParticleSimulation();
  public pointNumber: number = 500;

  constructor(public dataStore: DataStore, public dataService: DataService) {
  }

  async ngOnInit() {
    this.dataService.listPhysicsModels().subscribe(physics => {
      this.dataStore.physicsDataOptions = physics;
    });
    this.dataService.listSimulationModels().subscribe(simulations => {
      this.dataStore.simulationData = simulations[0];
      
      this.scene.setup(
        document.querySelector("canvas")!!,
        1200,
        1200
      ).then(() => {
        this.scene.setScene(
          this.dataStore.simulationData.physicsData,
          this.dataStore.simulationData.points
        );

        this.scene.simulationLoop(true);
        this.scene.renderLoop(true);
      });
    })


  }

  public createEmptyWorld() {
    this.dataStore.simulationData.points = [];
    this.scene.setScene(
      this.dataStore.simulationData.physicsData,
      this.dataStore.simulationData.points
    );
  }

  public createRandomWorld() {
    let newPoints: Point[] = [];
    this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
      newPoints.push(...create(this.pointNumber, type, 300));
    })
    this.dataStore.simulationData.points = newPoints;

    this.scene.setScene(
      this.dataStore.simulationData.physicsData,
      this.dataStore.simulationData.points
    );
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
    this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
  }

  multiplyForces(factor: number) {
    this.dataStore.simulationData.physicsData.forces.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] *= factor;
      })
    })

    // update scene values
    this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
  }

  async saveSimulation() {
    const sim = this.dataStore.simulationData;
    sim.points = await this.scene.getCurrentPoints();
    await this.dataService.saveSimulation(sim);
  }
}
