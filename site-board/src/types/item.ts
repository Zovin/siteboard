export type Item = {
    id: number;

    x: number;
    y: number;
    w: number;
    h: number;
    z: number;

    type: CardType;
    value: string
}

export type CardType = "input" | "iframe";