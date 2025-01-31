import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ParticleType, Point } from '../model/Point';
import { vec4 } from 'gl-matrix';
import { PROTON } from '../model/DefaultSimulationData';
import { PhysicsData } from '../model/Simulation';

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

interface PhysicsResponse {
    id: number,
    name: string,
    particle_types: any[]
}

@Injectable({ providedIn: 'root' })
export class DataService {

    private apiUrl = 'http://127.0.0.1:5000';

    private aiGenerateUrl = '/structure/ai-generate';

    private getPhysicsUrl = '/physics-model/get';
    private savePhysics = '/physics-model/get';

    constructor(private http: HttpClient) {
    }

    getPhysics(id: number): Observable<PhysicsData> {
        let url = this.apiUrl + this.getPhysicsUrl;

        return this.http.get<PhysicsResponse>(url, {
            params: { id: id },
        }).pipe(
            map((response: PhysicsResponse) => {
                let physics = new PhysicsData();
                response.particle_types.forEach(type => {
                    physics.types.push(new ParticleType(
                        type.name,
                        type.id,
                        vec4.fromValues(type.color.r, type.color.g, type.color.b, 1),
                        type.radius,
                        type.size,
                        type.mass
                    ));
                    physics.forces.push(
                        type.related_to.map((val: { force: any; }) => val.force)
                    );
                });
                return physics;
            }));
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
