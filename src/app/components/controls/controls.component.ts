import { Component, Input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NEUTRON, GREEN, PROTON, YELLOW } from 'src/app/model/DefaultSimulationData';
import { PhysicsData } from 'src/app/model/Simulation';
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

  @Input() public data: PhysicsData = new PhysicsData();

  public onDataChange = output();
  public onForcesChange = output();

  constructor() { }

  ngOnInit(): void {
  }

  randomForces() {
    this.data.types.forEach((type, rowIndex) => {
      type.radius = Math.random() * 300 + 50;
      type.mass = Math.random() * 2;
      type.size = Math.random() * 15 + 5;

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
}
