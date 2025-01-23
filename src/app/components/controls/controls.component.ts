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

  getParticleType(type: ParticleType): ParticleType {
    let result;
    this.data.forceByType.forEach((value, key) => {
      if (key.id === type.id) {
        result = key;
      }
    })
    return result!!;
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

  updateSize(type: ParticleType, event: Event) {
    const inputValue = Number((event.target as HTMLInputElement).value);

    this.data.forceByType.forEach((value, key) => {
      if (key.id === type.id) {
        key.size = inputValue;
      }
    })
    this.onForcesChange.emit();
  }

  updateMass(type: ParticleType, event: Event) {
    const inputValue = Number((event.target as HTMLInputElement).value);

    this.data.forceByType.forEach((value, key) => {
      if (key.id === type.id) {
        key.mass = inputValue;
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
    let cubeSize = 1200;
    this.data.points = create(this.points[0], RED, cubeSize)
      .concat(create(this.points[1], BLUE, cubeSize))
      .concat(create(this.points[2], YELLOW, cubeSize))
      .concat(create(this.points[3], GREEN, cubeSize));

    this.onDataChange.emit();
  }

  multiplyForces(factor: number) {
    this.data.forceByType.forEach((value, key) => {
      value.forEach(force => {
        force.force *= factor;
      })
    })
    this.onForcesChange.emit();
  }

  exportForces() {

    const forces = Array.from(this.data.forceByType.entries());

    const exportObj = {
      forces: forces,
      points: this.points
    }


    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  importForces(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const importedData = JSON.parse(e.target.result);

          this.data.forceByType = new Map(importedData.forces);
          this.points = importedData.points;

          console.log('Imported Data:', this.data.forceByType);
        } catch (error) {
          console.error('Invalid JSON file:', error);
        }
      };
      reader.readAsText(file);
      this.onDataChange.emit();
    }
  }
}
