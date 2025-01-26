import { Component, Input, OnInit, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ParticleType } from 'src/app/model/Point';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { vec4 } from 'gl-matrix';
import { PhysicsData } from 'src/app/model/Simulation';

@Component({
  selector: 'app-particle-type',
  imports: [MatSliderModule, MatCardModule, FormsModule],
  templateUrl: './particle-type.component.html',
  styleUrls: ['./particle-type.component.scss'],
})
export class ParticleTypeComponent implements OnInit {

  @Input() public simulationData!: PhysicsData;
  @Input() public particleType!: ParticleType;

  selectedParticleIndex = 0;

  public onDataChange = output();

  ngOnInit(): void {
    this.particleType = this.simulationData.types[0];
  }

  onValueChange() {
    this.onDataChange.emit();
  }

  getParticleColor() {
    return `rgba(
    ${this.getRgbaValue(this.particleType.color[0])}, 
    ${this.getRgbaValue(this.particleType.color[1])}, 
    ${this.getRgbaValue(this.particleType.color[2])}, 
    ${this.particleType.color[3]})`;
  }

  getRgbaValue(value: number) {
    return value * 255;
  }

  delete() {
    let index = this.selectedParticleIndex;
    this.next();
    this.simulationData.types.splice(index, 1);
  }

  add() {
    console.log("click");
    this.simulationData.addType(
      new ParticleType(
        "New Particle",
        this.simulationData.types.length,
        vec4.fromValues(Math.random(), Math.random(), Math.random(), 1),
        100,
        Math.random() * 25 + 5,
        0
      )
    )

    console.log("type added");
    this.selectedParticleIndex = this.simulationData.types.length - 1;
    this.particleType = this.simulationData.types[this.selectedParticleIndex];
  }

  next() {
    if (this.selectedParticleIndex < this.simulationData.types.length - 1) {
      this.selectedParticleIndex++;
    } else {
      this.selectedParticleIndex = 0;
    }
    this.particleType = this.simulationData.types[this.selectedParticleIndex];
  }

  prev() {
    if (this.selectedParticleIndex > 0) {
      this.selectedParticleIndex--;
    } else {
      this.selectedParticleIndex = this.simulationData.types.length - 1;
    }
    this.particleType = this.simulationData.types[this.selectedParticleIndex];
  }
}
