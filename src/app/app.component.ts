import { Component, OnInit } from '@angular/core';

import { SimulationData } from '../scene/model/Simulation';
import { SimulationComponent } from "./components/simulation/simulation.component";
import { PhysicsComponent } from "./components/physics/physics.component";
import { MoleculesComponent } from "./components/molecules/molecules.component";
import { DataService } from './services/data.service';
import { create } from '../scene/model/Point';
import { DataStore } from './store/data.store';
import { BOSON, ELECTRON, NEUTRON, PROTON } from './model/DefaultSimulationData';


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
}

