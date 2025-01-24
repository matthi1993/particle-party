import { Component, Input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ParticleType } from 'src/app/model/Point';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-particle-type',
  imports: [MatSliderModule, MatCardModule, FormsModule],
  templateUrl: './particle-type.component.html',
  styleUrls: ['./particle-type.component.scss'],
})
export class ParticleTypeComponent {

  @Input() public particleType!: ParticleType;
  public onDataChange = output();

  onValueChange($event: Event) {
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
}
