import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {ParticleType} from "../../../scene/model/Point";

export class Brush {
  public x: number = 0;
  public y: number = 0;

  public radius: number = 10;

  public active: boolean = true;
  public menuOpen: boolean = false;

  public count = 100;
}

@Component({
  selector: 'app-brush',
  imports: [
    FormsModule
  ],
  templateUrl: 'brush.component.html',
  styleUrl: 'brush.component.scss'
})
export class BrushComponent {
  @Input() public brush!: Brush;
  @Output() radiusChanged = new EventEmitter();

  constructor() {
  }

  onRadiusChanged() {
    console.log(this.brush.radius);
    this.radiusChanged.emit();
  }
}
