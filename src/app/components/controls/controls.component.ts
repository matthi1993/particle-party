import { AfterViewInit, Component, Input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BLUE, createDefaultSimulationModel, GREEN, RED, YELLOW } from 'src/app/model/DefaultSimulationData';
import { Force, SimulationData } from 'src/app/model/Simulation';
import { create, ParticleType } from 'src/app/model/Point';
import { MatCardModule } from '@angular/material/card';



@Component({
  selector: 'app-controls',
  imports: [MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule, MatCardModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent implements OnInit {

  @Input() public data: SimulationData = new SimulationData();
  public onDataChange = output();
  public onForcesChange = output();

  public points: number = 1000;

  public types: ParticleType[] = [];

  constructor() { }

  ngOnInit(): void {
    this.types = [RED, BLUE, YELLOW, GREEN];

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
    this.data.points = create(this.points, RED)
      .concat(create(this.points, BLUE))
      .concat(create(this.points, YELLOW))
      .concat(create(this.points, GREEN));

    this.onDataChange.emit();
  }
}
