import { Component, OnInit, ViewChild } from '@angular/core';

import { PhysicsData } from './model/Simulation';
import { createDefaultPhysicsModel } from './model/DefaultSimulationData';
import { SimulationComponent } from "./components/simulation/simulation.component";
import { PhysicsComponent } from "./components/physics/physics.component";
import { MoleculesComponent } from "./components/molecules/molecules.component";
import { DataService } from './services/data.service';
import { create, Point } from './model/Point';
import { randomRounded } from './utils';


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

  public physicsData?: PhysicsData;
  public points?: Point[];
  public dataLoaded = false;

  public page = Page.SIMULATION;
  pageEnum = Page;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    // Load initial Physics
    this.dataService.getPhysics(1).subscribe(physicsData => {
      this.physicsData = physicsData;

      //TODO get forces from backend
      this.physicsData.types.forEach((type, rowIndex) => {
        type.radius = randomRounded(0, 20);
        type.mass = randomRounded(0, 0.25);
        type.size = randomRounded(0.25, 3)
  
        this.physicsData!.types.forEach((col, colIndex) => {
          this.physicsData!.forces[rowIndex][colIndex] = randomRounded(-0.4, 0.4);
        })
      });

      this.points = [];
      this.physicsData.types.forEach(type => {
        console.log(type);
        this.points!.push(...create(300, type, 100));
      })
      this.dataLoaded = true;
    })
  }

  switchPage(page: Page) {
    this.page = page;
  }
}

