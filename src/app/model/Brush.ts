export enum BrushState {
    None = 'none',
    Paint = 'paint',
    Select = 'select'
}

export class Brush {
    public x: number = 0;
    public y: number = 0;

    public radius: number = 50;
    public count = 50;

    public state: BrushState = BrushState.None;

    public particleId: number = 0;
}