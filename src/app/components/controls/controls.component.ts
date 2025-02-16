import { Component, Input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PhysicsData } from 'src/app/model/Simulation';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { randomRounded } from './utils';


@Component({
  selector: 'app-controls',
  imports: [MatSliderModule, MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule, MatCardModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit {

  @Input() public data!: PhysicsData;

  public onDataChange = output();
  public onForcesChange = output();

  constructor() { }

  ngOnInit(): void {
  }

  randomForces() {
    this.data.types.forEach((type, rowIndex) => {
      type.radius = randomRounded(0, 20);
      type.mass = randomRounded(0, 0.25);
      type.size = randomRounded(0.25, 3)

      this.data.types.forEach((col, colIndex) => {
        this.data.forces[rowIndex][colIndex] = randomRounded(-0.4, 0.4);
      })
    });
    this.onDataChange.emit();
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
