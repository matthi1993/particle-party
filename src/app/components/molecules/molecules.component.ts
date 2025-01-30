import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SceneComponent } from "../scene/scene.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { ParticleType, Point, create } from 'src/app/model/Point';
import { Camera } from 'src/app/model/Camera';
import { vec4 } from 'gl-matrix';
import { FormsModule } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { getMouseNDC } from '../scene/scene.mousevent';

@Component({
  selector: 'app-molecules',
  imports: [FormsModule, SceneComponent, ParticleTypeCardComponent],
  templateUrl: './molecules.component.html',
  styleUrl: './molecules.component.scss'
})
export class MoleculesComponent implements OnInit {

  @Input() public physicsData!: PhysicsData;
  @ViewChild(SceneComponent) scene!: SceneComponent;

  public selectedType!: ParticleType;
  public editingPointStructure?: Point[];
  public aiInput: string = "";
  public points: Point[] = [];

  camera = new Camera(800, 800, 15)


  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.selectType(this.physicsData.types[0]);
    let element = document.querySelector("canvas")!!;
    element.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (this.editingPointStructure) {
        const ndc = getMouseNDC(event, element);
        this.scene.addPointsToScene(ndc.x, ndc.y, this.editingPointStructure);
      }
    });
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
    this.editingPointStructure = [
      new Point(vec4.fromValues(0, 0, 0, 0), this.selectedType)
    ];
  }

  async createWithAi() {
    this.dataService.getData(this.aiInput).subscribe(generatedPoints => {
      this.editingPointStructure = generatedPoints;
      this.scene.addPointsToScene(0, 0, generatedPoints);
    });
  }

}
