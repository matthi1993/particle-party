import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { ParticleTypeCardComponent } from "../particle-type-card/particle-type-card.component";
import { ParticleType} from 'src/scene/model/Point';
import { vec4 } from 'gl-matrix';
import { DataService } from 'src/app/services/data.service';
import { DataStore } from 'src/app/store/data.store';

@Component({
  selector: 'app-physics',
  imports: [ParticleTypeCardComponent],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.scss'
})
export class PhysicsComponent implements OnInit {

  @Output() typeChanged = new EventEmitter<ParticleType>();

  public selectedType!: ParticleType;

  constructor(public dataStore: DataStore, private dataService: DataService) { }

  ngOnInit(): void {
  }

  selectType(type: ParticleType) {
    this.selectedType = type;
    this.typeChanged.emit(this.selectedType);
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
    
    this.dataStore.simulationData.physicsData.types.push(newType);
    this.dataStore.simulationData.physicsData.forces.push(
      Array(this.dataStore.simulationData.physicsData.types.length).fill(0) //TODO, update all forces of all particles and set init value
    );

    this.selectType(newType);
  }

  removeSelectedType() {
    let index = this.dataStore.simulationData.physicsData.types.indexOf(this.selectedType);
    if (this.dataStore.simulationData.physicsData.types.length > 1) {
      this.dataStore.simulationData.physicsData.types.splice(index, 1)
      this.dataStore.simulationData.physicsData.forces.splice(index, 1);
      this.dataStore.simulationData.physicsData.forces.forEach(row => {
        row.splice(index, 1);
      })
    }

    // regenerate indices
    this.dataStore.simulationData.physicsData.types.forEach((type, index) => {
      type.id = index;
    })
    this.selectedType = this.dataStore.simulationData.physicsData.types[0];
  }

  saveModel() {
    /*const dialogRef = this.dialog.open(SaveDialog, {
      data: { name: "" },
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.dataStore.simulationData.physicsData.name = data;
        this.dataService.savePhysics(this.dataStore.simulationData.physicsData).then(data => {
          this.dataStore.simulationData.physicsData = data;
        });
      }
    })*/
  }

}