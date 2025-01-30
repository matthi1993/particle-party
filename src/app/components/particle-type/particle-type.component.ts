import { Component, Input, OnInit, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ParticleType } from 'src/app/model/Point';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { PhysicsData } from 'src/app/model/Simulation';

interface Position {
  x: number,
  y:number
}

@Component({
  selector: 'app-particle-type',
  imports: [MatSliderModule, MatCardModule, FormsModule],
  templateUrl: './particle-type.component.html',
  styleUrls: ['./particle-type.component.scss'],
})
export class ParticleTypeComponent implements OnInit {

  @Input() public physicsData!: PhysicsData;
  @Input() public particleType!: ParticleType;
  public orbitRadius = 250;

  public onDataChange = output();

  ngOnInit(): void {
  }

  getOrbitPosition(index: number): Position {
    const angle = (index / this.physicsData.forces.length) * 2 * Math.PI;
    const x = this.orbitRadius * Math.cos(angle);
    const y = this.orbitRadius * Math.sin(angle);
    return { x: x, y: y }
  }

  getTypeIndex(type: ParticleType): number {
    return this.physicsData.types.indexOf(type);
  }

  getOrbitStyle(index: number, type: ParticleType) {
    const pos = this.getOrbitPosition(index);

    let left = `calc(50% + ${pos.x}px - ${this.getCircleRadius(type) / 2}px)`;
    let top = `calc(50% + ${pos.y}px - ${this.getCircleRadius(type) / 2}px)`;

    return { left: left, top: top }
  }

  getLine(index: number) {
    const centerX = 0;
    const centerY = 0;

    const pos = this.getOrbitPosition(index);
    const dx = pos.x - centerX;
    const dy = pos.y - centerY;

    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    let inputRotate = 0;
    if(angle > 90) {
      inputRotate = 180;
    } else if(angle < -90) {
      inputRotate = 180;
    } 

    return {
      length,
      inputRotate:`rotate(${inputRotate}deg)`,
      transform: `rotate(${angle}deg) translate(0%, -50%)`
    };
  }

  getCircleRadius(type: ParticleType) {
    return type.size * 50;
  }

  onValueChange() {
    this.onDataChange.emit();
  }

  getParticleColor(type: ParticleType) {
    return `rgba(
    ${this.getRgbaValue(type.color[0])}, 
    ${this.getRgbaValue(type.color[1])}, 
    ${this.getRgbaValue(type.color[2])}, 
    1)`;
  }

  getRgbaValue(value: number) {
    return value * 255;
  }
}
