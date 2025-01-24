import { Component, Input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NEUTRON, GREEN, PROTON, YELLOW } from 'src/app/model/DefaultSimulationData';
import { SimulationData } from 'src/app/model/Simulation';
import { create, ParticleType } from 'src/app/model/Point';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { ParticleTypeComponent } from "../particle-type/particle-type.component";


@Component({
  selector: 'app-controls',
  imports: [MatSliderModule, MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule, MatCardModule, ParticleTypeComponent],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit {

  @Input() public data: SimulationData = new SimulationData();

  public onDataChange = output();
  public onForcesChange = output();

  constructor() { }

  ngOnInit(): void {
  }


  updateData() {
    let cubeSize = 1200;
    this.data.points = [];

    this.data.types.forEach((value, index) => {
      this.data.points.push(...create(this.data.pointsPerType[index], value, cubeSize));
    })

    this.onDataChange.emit();
  }

  randomForces() {
    this.data.types.forEach((type, rowIndex) => {
      type.radius = Math.random() * 300 + 50;
      type.mass = Math.random() * 2;
      type.size = Math.random() * 15 + 5;

     //this.data.pointsPerType[rowIndex] = Math.random() * 1000 + 100;

      this.data.types.forEach((col, colIndex) => {
        this.data.forces[rowIndex][colIndex] = (Math.random() * 6) - 3;
      })
    });
    this.onForcesChange.emit();
  }

  multiplyForces(factor: number) {
    this.data.forces.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        this.data.forces[rowIndex][colIndex] *= factor;
      })
    })
    this.onForcesChange.emit();
  }


  exportForces() {
    // TODO
    /*const forces = Array.from(this.data.forceByType.entries());

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

    window.URL.revokeObjectURL(url);*/
  }

  importForces(event: any) {
    // TODO
    /*const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const importedData = JSON.parse(e.target.result);

          this.data.forceByType = new Map(importedData.forces);
          this.points = importedData.points;
        } catch (error) {
          console.error('Invalid JSON file:', error);
        }
      };
      reader.readAsText(file);
      this.onDataChange.emit();
    }*/
  }
}
