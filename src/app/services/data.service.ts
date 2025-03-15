import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Point, Structure } from '../components/scene/model/Point';
import { PhysicsData } from '../components/scene/model/Simulation';
import { DataStore } from '../store/data.store';


@Injectable({ providedIn: 'root' })
export class DataService {


    constructor(private http: HttpClient, private dataStore: DataStore) {
    }

    saveStructure(structure: Structure): Observable<Structure> {
        alert("not implemented");
        return new Observable();
    }

    savePhysics(physicsData: PhysicsData): Observable<PhysicsData> {
        alert("not implemented");
        return new Observable();
    }

    listPhysicsModels(): Observable<PhysicsData[]> {
        alert("not implemented");
        return new Observable();
    }

    listStructures(): Observable<Structure[]> {
        alert("not implemented");
        return new Observable();
    }

    getPhysics(id: number): Observable<PhysicsData> {
        alert("not implemented");
        return new Observable();
    }

    getAiResponse(prompt: string): Observable<Point[]> {
        alert("not implemented");
        return new Observable();
    }
}
