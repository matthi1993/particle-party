import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ParticleType, Point, Structure } from '../model/Point';
import { vec4 } from 'gl-matrix';
import { PROTON } from '../model/DefaultSimulationData';
import { PhysicsData } from '../model/Simulation';
import { mapPhysicsRequest, PhysicsResponse } from './physics.mapper';
import { DataStore } from '../store/data.store';

interface AiInterfacePoint {
    position_x: number,
    position_y: number,
    position_z: number,
    type: string
}

interface AiMessage {
    points: AiInterfacePoint[]
}

interface AiResponse {
    message: string
}

@Injectable({ providedIn: 'root' })
export class DataService {

    private apiUrl = 'http://127.0.0.1:5000';

    private listStructuresUrl = '/structure/list'
    private saveStructuresUrl = '/structure/save'
    private aiGenerateUrl = '/structure/ai-generate';

    private listPhysicsUrl = '/physics-model/list';
    private getPhysicsUrl = '/physics-model/get';
    private savePhysicsUrl = '/physics-model/save';


    constructor(private http: HttpClient, private dataStore: DataStore) {
    }

    saveStructure(structure: Structure): Observable<Structure> {
        let url = this.apiUrl + this.saveStructuresUrl;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        let data = {
            structure: {
                name: structure.name,
                particles: structure.points.map((point, index) => {
                    return {
                        position: {
                            x: point.position[0],
                            y: point.position[1],
                            z: point.position[2],
                        },
                        type: point.particleType.id
                    }
                })
            }
        }
        return this.http.post<any>(url, data, { headers }).pipe(
            map((response: any) => {
                console.log(response)
                return structure; // TODO map response
            }),
            catchError(this.handleError));
    }

    savePhysics(physicsData: PhysicsData): Observable<PhysicsData> {
        let url = this.apiUrl + this.savePhysicsUrl;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        let data = {
            physics_model: {
                name: physicsData.name
            },
            types: physicsData.types.map((type, index) => {
                return {
                    name: type.name,
                    radius: type.radius,
                    size: type.size,
                    mass: type.mass,
                    color: {
                        x: type.color[0],
                        y: type.color[1],
                        z: type.color[2]
                    },
                    forces: physicsData.forces[index]
                }
            })

        }

        return this.http.post<PhysicsResponse>(url, data, { headers }).pipe(
            map((response: PhysicsResponse) => {
                return mapPhysicsRequest(response);
            }),
            catchError(this.handleError)
        );
    }

    listPhysicsModels(): Observable<PhysicsData[]> {
        let url = this.apiUrl + this.listPhysicsUrl;

        return this.http.get<PhysicsResponse[]>(url, {}).pipe(
            map((responseList: PhysicsResponse[]) => {
                let physicsList: PhysicsData[] = []
                responseList.forEach(response => {
                    physicsList.push(mapPhysicsRequest(response));
                })
                return physicsList;
            }),
            catchError((error) => {
                return of([new PhysicsData(-1, "")]);
            })
        );
    }

    listStructures(): Observable<Structure[]> {
        let url = this.apiUrl + this.listStructuresUrl;

        return this.http.get<any[]>(url, {}).pipe(
            map((responseList: any[]) => {
                let structureList: Structure[] = []
                responseList.forEach(response => {
                    let structure = new Structure();
                    structure.name = response.name;
                    structure.id = response.id;
                    response.particles.forEach((particle: any) => {
                        let point = new Point(vec4.fromValues(
                            particle.position[0],
                            particle.position[1],
                            particle.position[2],
                            1
                        ), this.dataStore.simulationData.physicsData.types.find(type => {
                            return type.id === particle.particle_type.id
                        })!!);
                        structure.points.push(point)
                    })
                    structureList.push(structure);
                })
                console.log(structureList);
                return structureList;
            }),
            catchError((error) => {
                return of([]);
            })
        );
    }

    getPhysics(id: number): Observable<PhysicsData> {
        let url = this.apiUrl + this.getPhysicsUrl;

        return this.http.get<PhysicsResponse>(url, {
            params: { id: id },
        }).pipe(
            map((response: PhysicsResponse) => { return mapPhysicsRequest(response); }),
            catchError(this.handleError)
        );
    }

    getAiResponse(prompt: string): Observable<Point[]> {
        let url = this.apiUrl + this.aiGenerateUrl;

        return this.http.get<AiResponse>(url, {
            params: { prompt: prompt },
        }).pipe(
            map((response: AiResponse) => {
                let points: Point[] = [];
                let aiMessage: AiMessage = JSON.parse(response.message)
                aiMessage.points.forEach(element => {
                    console.log(element);
                    points.push(
                        new Point(
                            vec4.fromValues(element.position_x, element.position_y, element.position_z, 0),
                            PROTON // todo get from response
                        )
                    )
                });
                return points;
            }),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            console.error('Client-side error:', error.error.message);
        } else {
            // Server-side error
            console.error(`Server returned code ${error.status}, body was:`, error.error);
        }
        return throwError(() => new Error('Something went wrong; please try again later.'));
    }
}
