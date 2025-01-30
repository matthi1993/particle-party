import { Component, Input, OnInit } from '@angular/core';
import { ControlsComponent } from "../controls/controls.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { ParticleTypeComponent } from "../particle-type/particle-type.component";
import { ParticleType } from 'src/app/model/Point';
import { vec4 } from 'gl-matrix';

@Component({
  selector: 'app-physics',
  imports: [ControlsComponent, ParticleTypeCardComponent, ParticleTypeComponent],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.scss'
})
export class PhysicsComponent implements OnInit {

  @Input() public physicsData!: PhysicsData;
  public selectedType!: ParticleType;

  ngOnInit(): void {
    this.selectedType = this.physicsData.types[0];
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
  }

  addType() {
    let length = this.physicsData.types.length;
    let newType = new ParticleType(
      "New Type " + length,
      length,
      vec4.fromValues(Math.random(), Math.random(), Math.random(), 1),
      Math.random() * 100 + 30,
      Math.random() * 3 + 0.5,
      Math.random()
    );
    this.physicsData.addType(newType);
    this.selectedType = newType;
  }

  removeSelectedType() {
    this.physicsData.removeType(this.selectedType);
    this.selectedType = this.physicsData.types[0];
  }

}
