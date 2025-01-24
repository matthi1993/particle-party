import { Component, OnInit, ViewChild } from '@angular/core';

import { ControlsComponent } from './components/controls/controls.component';
import { SimulationData } from './model/Simulation';
import { createDefaultSimulationModel } from './model/DefaultSimulationData';
import { SceneComponent } from './components/scene/scene.component';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [SceneComponent, ControlsComponent]
})
export class AppComponent implements OnInit {
  title = 'default';

  public simulationData: SimulationData = createDefaultSimulationModel();

  @ViewChild(SceneComponent) scene!: SceneComponent;

  public onDataChange() {
    this.scene.recreateScene();
  }

  public onForcesChange() {
    this.scene.updateForcesAndTypes();
  }

  async ngOnInit() {
  }

}

