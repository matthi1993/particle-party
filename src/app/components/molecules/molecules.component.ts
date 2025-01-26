import { Component, Input, OnInit } from '@angular/core';
import { SceneComponent } from "../scene/scene.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { PROTON, NEUTRON } from 'src/app/model/DefaultSimulationData';
import { ParticleType, Point, create } from 'src/app/model/Point';

@Component({
  selector: 'app-molecules',
  imports: [SceneComponent],
  templateUrl: './molecules.component.html',
  styleUrl: './molecules.component.scss'
})
export class MoleculesComponent implements OnInit {

  @Input() public physicsData!: PhysicsData;

  public selectedType!: ParticleType;

  public points: Point[] = [
    ...create(10, PROTON, 1),
    ...create(10, NEUTRON, 1)
  ];

  ngOnInit(): void {
    this.selectedType = this.physicsData.types[0];
  }

  selectType(type: ParticleType) {
      this.selectedType = type;
  }

}
