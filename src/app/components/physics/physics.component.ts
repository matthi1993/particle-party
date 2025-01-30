import { Component, Input, OnInit } from '@angular/core';
import { ControlsComponent } from "../controls/controls.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { ParticleTypeComponent } from "../particle-type/particle-type.component";
import { ParticleType } from 'src/app/model/Point';

@Component({
  selector: 'app-physics',
  imports: [ControlsComponent, ParticleTypeCardComponent, ParticleTypeComponent],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.scss'
})
export class PhysicsComponent implements OnInit{
  
  @Input() public physicsData!: PhysicsData;
  public selectedType!: ParticleType;

  ngOnInit(): void {
    this.selectedType = this.physicsData.types[0];
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
  }

}
