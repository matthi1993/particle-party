import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Point, Structure } from '../../scene/model/Point';
import { PhysicsData, SimulationData } from '../../scene/model/Simulation';
import { DataStore } from '../store/data.store';
import { Observable } from 'rxjs/internal/Observable';
import { combineLatest} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {

    public physics = [
        "/assets/presets/physics-base.json",
        "/assets/presets/orange.json",
    ]
    public structures = [
    ]
    public simulations = [
        "/assets/presets/simulation.json",
    ]

    constructor(private http: HttpClient, private dataStore: DataStore) {
    }

    async saveSimulation(sim: SimulationData): Promise<Structure> {
        return await this.saveAsJson(sim, "simulation.json");
    }

    async saveStructure(structure: Structure): Promise<Structure> {
        return await this.saveAsJson(structure, "structure.json");
    }

    async savePhysics(physicsData: PhysicsData): Promise<PhysicsData> {
        return await this.saveAsJson(physicsData, "physics.json");
    }

    listSimulationModels(): Observable<SimulationData[]> {
        let requests: Observable<SimulationData>[] = [];
        this.simulations.forEach(file => {
            requests.push(this.http.get<SimulationData>(file))
        })
        return combineLatest(requests);
    }

    listPhysicsModels(): Observable<PhysicsData[]> {
        let requests: Observable<PhysicsData>[] = [];
        this.physics.forEach(file => {
            requests.push(this.http.get<PhysicsData>(file))
        })
        return combineLatest(requests);
    }

    listStructures(): Observable<Structure[]> {
        let requests: Observable<Structure>[] = [];
        this.structures.forEach(file => {
            requests.push(this.http.get<Structure>(file))
        })
        return combineLatest(requests);
    }

    async getAiResponse(prompt: string): Promise<Point[]> {
        alert("not implemented");
        return [];
    }

    async saveAsJson(obj: any, name: string) {
        const json = JSON.stringify(obj)
        try {
            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: name,
                types: [
                    {
                        description: "JSON file",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });

            const writable = await fileHandle.createWritable();
            await writable.write(json);
            await writable.close();
        } catch (err) {
            console.error("Error saving file:", err);
        }

        return obj;
    }
}