import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ParticleType, Point } from '../model/Point';
import { vec4 } from 'gl-matrix';
import { PROTON } from '../model/DefaultSimulationData';

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

    private apiUrl = 'http://127.0.0.1:5000/point-ai';

    constructor(private http: HttpClient) {
    }

    getData(prompt: string): Observable<Point[]> {
        return this.http.get<AiResponse>(this.apiUrl, {
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
