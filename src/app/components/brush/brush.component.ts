import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";

export class Brush {
  public x: number = 0;
  public y: number = 0;

  public radius: number = 100;
  public count = 100;
}

@Component({
  selector: 'app-brush',
  imports: [FormsModule],
  templateUrl: 'brush.component.html',
  styleUrl: 'brush.component.scss'
})
export class BrushComponent {
  @Input() public brush!: Brush;
  @Output() brushChanged = new EventEmitter();

  onRadiusChanged() {
    this.brushChanged.emit();
  }
}
