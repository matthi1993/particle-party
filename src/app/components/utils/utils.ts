export function randomRounded(from: number, to: number): number {
    return Math.round((Math.random() * (to - from) + from) * 100) / 100;
}