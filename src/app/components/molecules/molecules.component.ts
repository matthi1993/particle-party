import { Component, Input, OnInit } from '@angular/core';
import { SceneComponent } from "../scene/scene.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { PROTON, NEUTRON } from 'src/app/model/DefaultSimulationData';
import { ParticleType, Point, create } from 'src/app/model/Point';
import { Camera } from 'src/app/model/Camera';

@Component({
  selector: 'app-molecules',
  imports: [SceneComponent],
  templateUrl: './molecules.component.html',
  styleUrl: './molecules.component.scss'
})
export class MoleculesComponent implements OnInit {

  @Input() public physicsData!: PhysicsData;

  public selectedType!: ParticleType;

  canvasWidth = 400;
  canvasHeight = 400;
  camera = new Camera(this.canvasWidth, this.canvasHeight, 5)

  public points: Point[] = [
    ...create(5, PROTON, 0.01),
    ...create(5, NEUTRON, 0.01)
  ];

  ngOnInit(): void {
    this.selectedType = this.physicsData.types[0];
  }

  selectType(type: ParticleType) {
      this.selectedType = type;
  }

}
