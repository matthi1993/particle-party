import { Component, Input, OnInit, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ParticleType } from 'src/app/model/Point';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { vec4 } from 'gl-matrix';

@Component({
  selector: 'app-particle-type',
  imports: [MatSliderModule, MatCardModule, FormsModule],
  templateUrl: './particle-type.component.html',
  styleUrls: ['./particle-type.component.scss'],
})
export class ParticleTypeComponent implements OnInit {

  @Input() public allTypes!: ParticleType[];
  @Input() public particleType!: ParticleType;

  selectedParticleIndex = 0;

  public onDataChange = output();

  ngOnInit(): void {
    this.particleType = this.allTypes[0];
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
    this.allTypes = this.allTypes.splice(index, index);
    // TODO this is not working yet
  }

  add() {
    this.allTypes.push(
      new ParticleType("New Particle", this.allTypes.length, vec4.fromValues(1, 1, 1, 1), 100, 10, 0)
    );
    this.selectedParticleIndex = this.allTypes.length - 1;
    // TODO this is not working yet
  }

  next() {
    console.log(this.allTypes);
    if (this.selectedParticleIndex < this.allTypes.length - 1) {
      this.selectedParticleIndex++;
    } else {
      this.selectedParticleIndex = 0;
    }
    this.particleType = this.allTypes[this.selectedParticleIndex];
  }
  prev() {
    console.log(this.allTypes);
    if (this.selectedParticleIndex > 0) {
      this.selectedParticleIndex--;
    } else {
      this.selectedParticleIndex = this.allTypes.length - 1;
    }
    this.particleType = this.allTypes[this.selectedParticleIndex];
  }
}
