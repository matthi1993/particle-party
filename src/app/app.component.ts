import { Component, OnInit } from '@angular/core';

import { PhysicsData, SimulationData } from './model/Simulation';
import { SimulationComponent } from "./components/simulation/simulation.component";
import { PhysicsComponent } from "./components/physics/physics.component";
import { MoleculesComponent } from "./components/molecules/molecules.component";
import { DataService } from './services/data.service';
import { create, Point } from './model/Point';
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
export class AppComponent implements OnInit {
  title = 'Simulation';
  public dataLoaded = false;

  public page = Page.SIMULATION;
  pageEnum = Page;

  constructor(private dataService: DataService, private dataStore: DataStore) {
  }

  ngOnInit(): void {

    this.dataStore.physicsDataOptions = [];
    this.dataStore.simulationData = new SimulationData();
    this.dataStore.simulationData.physicsData.addType(PROTON);
    this.dataStore.simulationData.physicsData.addType(NEUTRON);
    this.dataStore.simulationData.physicsData.addType(ELECTRON);
    this.dataStore.simulationData.physicsData.addType(BOSON);

    this.dataStore.simulationData.physicsData.forces = [
      [0.2, 0.1, 0.0, 0.0],
      [-0.2, 0.2, 0.1, 0.0],
      [0.0, 0.0, 0.2, 0.1],
      [0.1, 0.0, 0.0, -0.2],
    ]

    let size = 200;
    this.dataStore.simulationData.points = [];
    this.dataStore.simulationData.points.push(...create(1000, PROTON, size));
    this.dataStore.simulationData.points.push(...create(1000, NEUTRON, size));
    this.dataStore.simulationData.points.push(...create(1000, ELECTRON, size));
    this.dataStore.simulationData.points.push(...create(1000, BOSON, size));

    this.dataLoaded = true;

    /*this.dataService.listPhysicsModels().subscribe(physicsData => {
      let points: Point[] = [];

      this.dataStore.physicsDataOptions = physicsData;
      this.dataStore.simulationData = new SimulationData();
      this.dataStore.simulationData.physicsData = physicsData[0];
      this.dataStore.simulationData.points = points;

      this.dataService.listStructures().subscribe(structures => {
        this.dataStore.structures = structures;

        this.dataLoaded = true;
      })
    })*/
  }

  switchPage(page: Page) {
    this.page = page;
  }
}

