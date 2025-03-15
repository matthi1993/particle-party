import { Component, OnInit } from '@angular/core';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { ParticleTypeComponent } from "../particle-type/particle-type.component";
import { ParticleType } from 'src/scene/model/Point';
import { vec4 } from 'gl-matrix';
import { DataService } from 'src/app/services/data.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { SaveDialog } from '../save-dialog/save-dialog';
import { DataStore } from 'src/app/store/data.store';




@Component({
  selector: 'app-physics',
  imports: [MatSelectModule, MatFormFieldModule, ParticleTypeCardComponent, ParticleTypeComponent],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.scss'
})
export class PhysicsComponent implements OnInit {


  public selectedType!: ParticleType;

  constructor(public dataStore: DataStore, private dataService: DataService, private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
  }

  addType() {
    let length = this.dataStore.simulationData.physicsData.types.length;
    let newType = new ParticleType(
      "New Type " + length,
      length,
      vec4.fromValues(Math.random(), Math.random(), Math.random(), 1),
      Math.random() * 30 + 10,
      Math.random() * 1 + 0.5,
      Math.random()
    );
    this.dataStore.simulationData.physicsData.addType(newType);
    this.selectedType = newType;
  }

  removeSelectedType() {
    this.dataStore.simulationData.physicsData.removeType(this.selectedType);
    this.selectedType = this.dataStore.simulationData.physicsData.types[0];
  }

  saveModel() {
    const dialogRef = this.dialog.open(SaveDialog, {
      data: { name: "" },
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.dataStore.simulationData.physicsData.name = data;
        this.dataService.savePhysics(this.dataStore.simulationData.physicsData).subscribe(data => {
          this.dataStore.simulationData.physicsData = data;
        });
      }
    })
  }

}