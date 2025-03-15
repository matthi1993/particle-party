import { Component, OnInit, ViewChild } from '@angular/core';
import { SceneComponent } from "../../../scene/scene.component";
import { ParticleType, Point, Structure } from 'src/scene/model/Point';
import { Camera } from 'src/scene/model/Camera';
import { vec4 } from 'gl-matrix';
import { FormsModule } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { getMouseNDC } from '../../../scene/scene.mousevent';
import { DataStore } from 'src/app/store/data.store';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-molecules',
  imports: [MatInput, MatFormField, MatLabel, FormsModule, SceneComponent, ParticleTypeCardComponent],
  templateUrl: './molecules.component.html',
  styleUrl: './molecules.component.scss'
})
export class MoleculesComponent implements OnInit {

  @ViewChild(SceneComponent) scene!: SceneComponent;

  public structure: Structure = new Structure();

  public selectedType!: ParticleType;
  public editingPointStructure?: Point[];
  public aiInput: string = "";
  public points: Point[] = [];

  camera = new Camera(800, 800, 15)


  constructor(public dataStore: DataStore, private dataService: DataService) {
  }

  ngOnInit(): void {
    this.selectType(this.dataStore.simulationData.physicsData.types[0]);
    let element = document.querySelector("canvas")!!;

    let mousePos = [0,0];
    element.addEventListener('mousedown', (event) => {
      mousePos = [event.clientX, event.clientY];
    });

    element.addEventListener('mouseup', (event) => {
      event.preventDefault();
      if (this.editingPointStructure) {
        if(mousePos[0] == event.clientX && mousePos[1] == event.clientY) {
          const ndc = getMouseNDC(event, element);
          this.scene.addPointsToScene(ndc.x, ndc.y, this.editingPointStructure);
          this.scene.createScene(this.scene.points);
        }
      }
    });
  }

  save() {
    this.structure.points = this.scene.points;
    this.dataService.saveStructure(this.structure).subscribe(structure => {
      this.structure = structure;
      this.dataStore.structures.push(structure);
    });;
  }
  reset() {
    this.structure = new Structure();
    this.scene.createScene([]);
  }

  selectStructure(structure: Structure) {
    this.structure.points = [];
    structure.points.forEach(point => {
      this.structure.points.push(
        new Point(
          vec4.fromValues(point.position[0], point.position[1], point.position[2], 1),
          point.particleType
        ));
    });
    this.scene.createScene(this.structure.points);
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
    this.editingPointStructure = [
      new Point(vec4.fromValues(0, 0, 0, 0), this.selectedType)
    ];
  }

  async createWithAi() {
    this.dataService.getAiResponse(this.aiInput).subscribe(generatedPoints => {
      this.editingPointStructure = generatedPoints;
      this.scene.addPointsToScene(0, 0, generatedPoints);
    });
  }

}
