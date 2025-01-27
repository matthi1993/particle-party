import { Component, Input, OnInit } from '@angular/core';
import { SceneComponent } from "../scene/scene.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { ParticleType, Point, create } from 'src/app/model/Point';
import { Camera } from 'src/app/model/Camera';
import { vec4 } from 'gl-matrix';

@Component({
  selector: 'app-molecules',
  imports: [SceneComponent],
  templateUrl: './molecules.component.html',
  styleUrl: './molecules.component.scss'
})
export class MoleculesComponent implements OnInit {

  @Input() public physicsData!: PhysicsData;

  public selectedType!: ParticleType;
  public editingPointStructure?: Point[];

  canvasWidth = 400;
  canvasHeight = 400;
  camera = new Camera(this.canvasWidth, this.canvasHeight, 5)

  public points: Point[] = [];

  ngOnInit(): void {
    this.selectedType = this.physicsData.types[0];
  }

  selectType(type: ParticleType) {
      this.selectedType = type;
      this.editingPointStructure = [
        new Point(vec4.fromValues(0, 0, 0, 0), 
        this.selectedType)
      ];
  }

}
