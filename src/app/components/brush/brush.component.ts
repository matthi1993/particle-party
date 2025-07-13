import { Component, OnInit, OnDestroy, HostListener, Input, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brush, BrushState } from '../../model/Brush';

@Component({
  selector: 'app-brush',
  templateUrl: './brush.component.html',
  styleUrls: ['./brush.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class BrushComponent implements OnInit, OnDestroy {
  @Input() brush!: Brush;
  @Input() canvas!: ElementRef<HTMLCanvasElement>;
  
  tempRadius: number = 10;
  isMouseOnCanvas: boolean = false;
  BrushState = BrushState; // Make enum available in template

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.brush.x = event.clientX;
    this.brush.y = event.clientY;
  }

  ngOnInit() {
    // Initialize with current brush radius
    this.tempRadius = this.brush.radius;
    
    // Add mouse enter/leave listeners to the canvas
    if (this.canvas && this.canvas.nativeElement) {
      this.canvas.nativeElement.addEventListener('mouseenter', () => {
        this.isMouseOnCanvas = true;
      });
      
      this.canvas.nativeElement.addEventListener('mouseleave', () => {
        this.isMouseOnCanvas = false;
      });
    }
  }

  ngOnDestroy() {
    // Cleanup event listeners
    if (this.canvas && this.canvas.nativeElement) {
      this.canvas.nativeElement.removeEventListener('mouseenter', () => {
        this.isMouseOnCanvas = true;
      });
      this.canvas.nativeElement.removeEventListener('mouseleave', () => {
        this.isMouseOnCanvas = false;
      });
    }
  }
}
