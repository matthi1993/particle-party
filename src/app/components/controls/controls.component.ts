import { Component, Input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PhysicsData } from 'src/app/model/Simulation';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';


@Component({
  selector: 'app-controls',
  imports: [MatSliderModule, MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule, MatCardModule],
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

  randomRounded():number {
    return Math.round(Math.random() * 100) / 100;
  }

  randomForces() {
    this.data.types.forEach((type, rowIndex) => {
      type.radius = (this.randomRounded() * 1 + 1);
      type.mass = (this.randomRounded() * 0.05);
      type.size = (this.randomRounded() * 1 + 0.75);

      this.data.types.forEach((col, colIndex) => {
        this.data.forces[rowIndex][colIndex] = (this.randomRounded() * 0.5) - 0.25;
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
