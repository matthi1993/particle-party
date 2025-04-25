import {Component, Input} from '@angular/core';
import {TabsModule} from 'primeng/tabs';
import {FormsModule} from "@angular/forms";
import {create, ParticleType, Point} from "../../../scene/model/Point";
import {randomRounded} from "../utils/utils";
import {vec4} from "gl-matrix";
import {DataStore} from "../../store/data.store";
import {DataService} from "../../services/data.service";
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import {ParticleSimulation} from "../../../scene/particle-simulation";
import {ParticleTypeCardComponent} from "../particle-type-card/particle-type-card.component";
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-menu',
  imports: [ChipModule, TabsModule, FormsModule, SliderModule, InputNumberModule, FloatLabelModule, ParticleTypeCardComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  @Input() public scene: ParticleSimulation = new ParticleSimulation();
  public pointNumber: number = 500;
  public selectedType!: ParticleType;

  constructor(public dataStore: DataStore, public dataService: DataService) {
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
      console.log(type.id);
      newPoints.push(...create(this.pointNumber, type, 200));
    })
    this.dataStore.simulationData.points = newPoints;

    this.scene.setScene(
        this.dataStore.simulationData.physicsData,
        this.dataStore.simulationData.points
    );
  }

  randomForces() {
    this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
      type.radius = randomRounded(0, 50);
      type.mass = randomRounded(0, 0.25);
      type.size = randomRounded(0.5, 1)
      type.color = vec4.fromValues(
          randomRounded(0, 1),
          randomRounded(0, 1),
          randomRounded(0, 1),
          1
      )

      this.dataStore.simulationData.physicsData.types.forEach((col, colIndex) => {
        this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] = randomRounded(-0.5, 0.5);
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

  addType() {
    let length = this.dataStore.simulationData.physicsData.types.length;
    let newType = new ParticleType(
        "New Type " + length,
        length,
        vec4.fromValues(Math.random(), Math.random(), Math.random(), 1),
        Math.random() * 30 + 10,
        Math.random() * 1 + 0.5,
        Math.random()
    );

    this.dataStore.simulationData.physicsData.types.push(newType);
    this.dataStore.simulationData.physicsData.forces.push(
        Array(this.dataStore.simulationData.physicsData.types.length).fill(0) //TODO, update all forces of all particles and set init value
    );

    this.selectType(newType);
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
    //this.typeChanged.emit(this.selectedType);
  }

  removeSelectedType() {
    let index = this.dataStore.simulationData.physicsData.types.indexOf(this.selectedType);
    if (this.dataStore.simulationData.physicsData.types.length > 1) {
      this.dataStore.simulationData.physicsData.types.splice(index, 1)
      this.dataStore.simulationData.physicsData.forces.splice(index, 1);
      this.dataStore.simulationData.physicsData.forces.forEach(row => {
        row.splice(index, 1);
      })
    }

    // regenerate indices
    this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
      type.id = index;
    })
    this.selectedType = this.dataStore.simulationData.physicsData.types[0];
  }
}
