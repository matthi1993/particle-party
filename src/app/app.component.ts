import { Component } from '@angular/core';

import { SimulationData } from './model/Simulation';
import { createDefaultSimulationModel } from './model/DefaultSimulationData';
import { SimulationComponent } from "./components/simulation/simulation.component";
import { PhysicsComponent } from "./components/physics/physics.component";
import { MoleculesComponent } from "./components/molecules/molecules.component";


export enum Page {
  SIMULATION,
  PHYSICS,
  MOLECULES
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [SimulationComponent, PhysicsComponent, MoleculesComponent]
})
export class AppComponent {
  title = 'Simulation';

  public simulationData: SimulationData = createDefaultSimulationModel();
  public page = Page.SIMULATION;
  pageEnum = Page;

  switchPage(page: Page) {
    this.page = page;
  }
}

