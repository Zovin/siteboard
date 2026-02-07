export type Item = {
    id: number;

    x: number;
    y: number;
    w: number;
    h: number;
    z: number;

    type: CardType;
    value: string;
    anchors: Anchor[];
}

export type Point = {
  x: number;
  y: number;
};

export type Arrow = {
  id: string;
  
  from: {
    cardId: number;
    anchor: Anchor;
  }

  to: ArrowEnd;
}

export type Anchor = "top" | "right" | "bottom" | "left";
export type ArrowEnd = 
   { type: "free"; x: number; y: number }
  | { type: "attached"; cardId: number; anchor: Anchor };

export type CardType = "input" | "iframe";

export type InteractionMode =
| "idle"
| "dragging-card"
| "drawing-arrow"
| "resizing"
| "camera-move"

export type ToolMode = "select" | "arrow"
