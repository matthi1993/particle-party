import { Component, Input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BLUE, GREEN, RED, YELLOW } from 'src/app/model/DefaultSimulationData';
import { SimulationData } from 'src/app/model/Simulation';
import { create, ParticleType } from 'src/app/model/Point';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';


@Component({
  selector: 'app-controls',
  imports: [MatSliderModule, MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule, MatCardModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit {

  @Input() public data: SimulationData = new SimulationData();
  public points: number[] = [100, 100, 100, 100];

  public onDataChange = output();
  public onForcesChange = output();


  public types: ParticleType[] = [];

  constructor() { }

  ngOnInit(): void {
    this.types = [RED, BLUE, YELLOW, GREEN];

  }

  getRadiusValue(type: ParticleType) {
    let result = undefined;
    this.data.forceByType.forEach((value, key) => {
      if (key.id === type.id) {
        result = key.radius;
      }
    })
    return result;
  }

  getPointValue(type: ParticleType) {
    return this.points[type.id];
  }

  updatePoints(type: ParticleType, event: Event) {
    const inputValue = Number((event.target as HTMLInputElement).value);
    this.points[type.id] = inputValue;
  }

  updateRadius(type: ParticleType, event: Event) {
    const inputValue = Number((event.target as HTMLInputElement).value);

    this.data.forceByType.forEach((value, key) => {
      if (key.id === type.id) {
        key.radius = inputValue;
      }
    })
    this.onForcesChange.emit();
  }

  getForceValue(type1: ParticleType, type2: ParticleType) {
    let result = undefined;

    this.data.forceByType.forEach((value, key) => {
      if (key.id === type1.id) {
        value.forEach(force => {
          if (force.particleB.id == type2.id) {
            result = force.force;
          }
        })
      }
    })

    return result;
  }

  updateForce(type1: ParticleType, type2: ParticleType, event: Event) {
    const inputValue = Number((event.target as HTMLInputElement).value);

    this.data.forceByType.forEach((value, key) => {
      if (key.id === type1.id) {
        value.forEach(force => {
          if (force.particleB.id == type2.id) {
            force.force = inputValue;
          }
        })
      }
    })
    this.onForcesChange.emit();
  }

  updateData() {
    let cubeSize = 600;
    this.data.points = create(this.points[0], RED, cubeSize)
      .concat(create(this.points[1], BLUE, cubeSize))
      .concat(create(this.points[2], YELLOW, cubeSize))
      .concat(create(this.points[3], GREEN, cubeSize));

    this.onDataChange.emit();
  }
}
