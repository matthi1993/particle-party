import { Injectable } from "@angular/core";
import { PhysicsData, SimulationData } from "../../scene/model/Simulation";

@Injectable({ providedIn: 'root' })
export class DataStore {
    public simulationData: SimulationData = new SimulationData();

    public physicsDataOptions: PhysicsData[] = [];
}