import { Component } from '@angular/core';

import { SimulationComponent } from "./components/simulation/simulation.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [SimulationComponent]
})
export class AppComponent {
  title = 'Simulation';
}

