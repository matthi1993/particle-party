import { Injectable } from "@angular/core";
import { PhysicsData, SimulationData } from "../components/scene/model/Simulation";
import { Structure } from "../components/scene/model/Point";

@Injectable({ providedIn: 'root' })
export class DataStore {
    public simulationData: SimulationData = new SimulationData();

    public physicsDataOptions: PhysicsData[] = [];
    public structures: Structure[] = [];
}