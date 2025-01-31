import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ParticleType, Point } from '../model/Point';
import { vec4 } from 'gl-matrix';
import { PROTON } from '../model/DefaultSimulationData';
import { PhysicsData } from '../model/Simulation';
import { mapPhysicsRequest, PhysicsResponse } from './physics.mapper';

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

    private aiGenerateUrl = '/structure/ai-generate';

    private listPhysicsUrl = '/physics-model/list';
    private getPhysicsUrl = '/physics-model/get';
    private savePhysicsUrl = '/physics-model/save';

    constructor(private http: HttpClient) {
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
                console.log(response)
                return mapPhysicsRequest(response);
            }));
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
            }));
    }

    getPhysics(id: number): Observable<PhysicsData> {
        let url = this.apiUrl + this.getPhysicsUrl;

        return this.http.get<PhysicsResponse>(url, {
            params: { id: id },
        }).pipe(
            map((response: PhysicsResponse) => { return mapPhysicsRequest(response); }));
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
            }));
    }
}
