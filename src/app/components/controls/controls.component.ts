import { Component, Input, output } from '@angular/core';
import { ParticleType, Point, Vec4, create } from 'src/app/model/Point';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';



const RED = new ParticleType(0, new Vec4(1, 0, 0, 1), 100);
const GREEN = new ParticleType(1, new Vec4(0, 1, 0, 1), 100);
const BLUE = new ParticleType(2, new Vec4(0, 0, 1, 1), 100);
const YELLOW = new ParticleType(3, new Vec4(1, 1, 0, 1), 100);

export class Force {
  public particleA: ParticleType;
  public particleB: ParticleType;
  public force: number;

  constructor(particleA: ParticleType, particleB: ParticleType, force: number) {
    this.particleA = particleA;
    this.particleB = particleB;
    this.force = force;
  }
}

export class SimulationData {
  public points: Point[] = [];
  public types: ParticleType[] = [];
  public forces: Force[] = [];

  constructor() {

    // setup default
    this.types = [RED, GREEN, BLUE, YELLOW];

    this.forces = [
      new Force(RED, RED, -10),
      new Force(RED, GREEN, 10),
      new Force(RED, BLUE, 0),
      new Force(RED, YELLOW, 10),

      new Force(GREEN, GREEN, 10),
      new Force(GREEN, RED,10),
      new Force(GREEN, BLUE, 5),
      new Force(GREEN, YELLOW, 2),

      new Force(BLUE, BLUE, 10),
      new Force(BLUE, RED, 0),
      new Force(BLUE, GREEN, 5),
      new Force(BLUE, YELLOW, -3),


      new Force(YELLOW, YELLOW, -10),
      new Force(YELLOW, RED, 10),
      new Force(YELLOW, GREEN, 2),
      new Force(YELLOW, BLUE, -3),
    ];

    this.points = create(3000, RED)
      .concat(create(3000, GREEN))
      .concat(create(3000, BLUE))
      .concat(create(3000, YELLOW));
  }
}

@Component({
  selector: 'app-controls',
  imports: [MatButtonModule, MatInputModule, FormsModule, MatFormFieldModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent {

  @Input() public data: SimulationData = new SimulationData();
  public onDataChange = output<SimulationData>();

  public points: number = 1000;

  constructor() {
  }

  updateData() {
    this.data = new SimulationData();
    this.data.points = create(this.points, RED)
      .concat(create(this.points, GREEN))
      .concat(create(this.points, BLUE))
      .concat(create(this.points, YELLOW));

    this.onDataChange.emit(this.data);
  }
}
