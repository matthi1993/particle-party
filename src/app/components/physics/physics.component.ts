import { Component, Input, OnInit } from '@angular/core';
import { ControlsComponent } from "../controls/controls.component";
import { PhysicsData } from 'src/app/model/Simulation';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { ParticleTypeComponent } from "../particle-type/particle-type.component";
import { ParticleType } from 'src/app/model/Point';
import { vec4 } from 'gl-matrix';
import { DataService } from 'src/app/services/data.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { SaveDialog } from '../save-dialog/save-dialog';




@Component({
  selector: 'app-physics',
  imports: [MatSelectModule, MatFormFieldModule, ControlsComponent, ParticleTypeCardComponent, ParticleTypeComponent],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.scss'
})
export class PhysicsComponent implements OnInit {


  public selectedType!: ParticleType;

  public physicsDataOptions!: PhysicsData[]
  @Input() public physicsData!: PhysicsData;

  constructor(private dataService: DataService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.dataService.listPhysicsModels().subscribe(models => {
      console.log(models);
      this.physicsDataOptions = models;
      this.physicsData = this.physicsDataOptions[0];
      this.selectedType = this.physicsData.types[0];
    })

  }

  selectType(type: ParticleType) {
    this.selectedType = type;
  }

  addType() {
    let length = this.physicsData.types.length;
    let newType = new ParticleType(
      "New Type " + length,
      length,
      vec4.fromValues(Math.random(), Math.random(), Math.random(), 1),
      Math.random() * 100 + 30,
      Math.random() * 3 + 0.5,
      Math.random()
    );
    this.physicsData.addType(newType);
    this.selectedType = newType;
  }

  removeSelectedType() {
    this.physicsData.removeType(this.selectedType);
    this.selectedType = this.physicsData.types[0];
  }

  saveModel() {
    const dialogRef = this.dialog.open(SaveDialog, {
      data: { name: "" },
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.physicsData.name = data;
        this.dataService.savePhysics(this.physicsData).subscribe(data => {
          this.physicsData = data;
        });
      }
    })
  }

}