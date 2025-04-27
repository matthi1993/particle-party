import {Component, Input} from '@angular/core';
import {TabsModule} from 'primeng/tabs';
import {FormsModule} from "@angular/forms";
import {Color, create, ParticleType, Point} from "../../../scene/model/Point";
import {randomRounded} from "../utils/utils";
import {vec4, vec3} from "gl-matrix";
import {DataStore} from "../../store/data.store";
import {DataService} from "../../services/data.service";
import {SliderModule} from 'primeng/slider';
import {InputNumberModule} from 'primeng/inputnumber';
import {FloatLabelModule} from 'primeng/floatlabel';
import {ParticleSimulation} from "../../../scene/particle-simulation";
import {ChipModule} from 'primeng/chip';
import {FileSelectEvent, FileUploadModule} from 'primeng/fileupload';
import {SimulationData} from "../../../scene/model/Simulation";
import {readFile} from "../utils/file-utils";
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FieldsetModule } from 'primeng/fieldset';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
  selector: 'app-menu',
  imports: [ColorPickerModule, FieldsetModule, InputTextModule, ButtonModule, FileUploadModule, ChipModule, TabsModule, FormsModule, SliderModule, InputNumberModule, FloatLabelModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  @Input() public scene: ParticleSimulation = new ParticleSimulation();
  public pointNumber: number = 500;

  constructor(public dataStore: DataStore, public dataService: DataService) {
  }

  public createRandomWorld() {
    let newPoints: Point[] = [];
    this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
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
      this.dataStore.simulationData.physicsData.types.forEach((col, colIndex) => {
        this.dataStore.simulationData.physicsData.forces[rowIndex][colIndex] = randomRounded(-0.5, 0.5);
      })
    });

    // update scene values
    this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
  }

  randomParticleValues() {
    this.dataStore.simulationData.physicsData.types.forEach((type, rowIndex) => {
      type.radius = randomRounded(0, 50);
      type.mass = randomRounded(0, 0.25);
      type.size = randomRounded(0.25, 1)
      type.color = new Color(
          randomRounded(0, 255),
          randomRounded(0, 255),
          randomRounded(0, 255)
      )
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

  async selectScene(event: FileSelectEvent) {
    this.dataStore.simulationData = await readFile<SimulationData>(event);
    this.scene.setScene(
        this.dataStore.simulationData.physicsData,
        this.dataStore.simulationData.points
    )
  }

  updatePhysics() {
    this.scene.updatePhysics(this.dataStore.simulationData.physicsData);
  }

  addType() {
    let length = this.dataStore.simulationData.physicsData.types.length;
    let newType = new ParticleType(
        "New Type " + length,
        length,
        new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255),
        Math.random() * 30 + 10,
        Math.random() * 1 + 0.5,
        Math.random()
    );

    this.dataStore.simulationData.physicsData.types.push(newType);
    this.dataStore.simulationData.physicsData.forces.push(
        Array(this.dataStore.simulationData.physicsData.types.length).fill(0) //TODO, update all forces of all particles and set init value
    );
  }

  deleteType(index: number) {
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
  }
}
