import { Component, Input, OnInit, output } from '@angular/core';
import { ParticleType } from 'src/app/components/scene/model/Point';
@Component({
  selector: 'app-particle-type-card',
  imports: [],
  templateUrl: './particle-type-card.component.html',
  styleUrls: ['./particle-type-card.component.scss'],
})
export class ParticleTypeCardComponent {

  @Input() public particleType!: ParticleType;
  @Input() public selected = false;

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
