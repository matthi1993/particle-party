import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Point } from '../../scene/model/Point';
import { Structure } from '../../scene/model/Structure';
import { PhysicsData, SimulationData } from '../../scene/model/Simulation';
import { DataStore } from '../store/data.store';
import { Observable } from 'rxjs/internal/Observable';
import { combineLatest, switchMap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {

    public physics: string[] = []
    public structures: string[] = []

    constructor(private http: HttpClient, private dataStore: DataStore) {
    }

    loadPresetList(): Observable<{ label: string; value: string }[]> {
        return this.http.get<string[]>('assets/presets/presets.json').pipe(
            map(files => files.map(file => ({
                label: file.replace('.json', ''),
                value: `assets/presets/${file}`
            })))
        );
    }

    loadPreset(presetPath: string): Observable<SimulationData> {
        return this.http.get<SimulationData>(presetPath);
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


    listStructures(): Observable<Structure[]> {
        let requests: Observable<Structure>[] = [];
        this.structures.forEach(file => {
            requests.push(this.http.get<Structure>(file))
        })
        return combineLatest(requests);
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