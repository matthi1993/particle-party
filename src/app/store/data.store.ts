import { Injectable } from "@angular/core";
import { PhysicsData, SimulationData } from "../../scene/model/Simulation";
import { Structure } from "../../scene/model/Point";

@Injectable({ providedIn: 'root' })
export class DataStore {
    public simulationData: SimulationData = new SimulationData();

    public physicsDataOptions: PhysicsData[] = [];
    public structures: Structure[] = [];
}