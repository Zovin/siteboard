import type { Anchor, ArrowEnd, Item } from "../types/item"

const SNAP_DISTANCE = 40;

export const getAnchorPosition = (item: Item, anchor: Anchor) => {
    switch(anchor) {
        case "top":
            return {x: item.x + item.w / 2, y: item.y }
        case "bottom":
            return {x: item.x + item.w / 2, y: item.y + item.h}
        case "left":
            return {x: item.x, y: item.y + item.h / 2}
        case "right":
            return {x: item.x + item.w, y: item.y + item.h / 2}
    }
}

export const findSnapTarget = (worldX: number, worldY: number, items: Item[]): ArrowEnd | null  =>{
    for (const card of items) {
        for (const side of card.anchors) {
            const pos = getAnchorPosition(card, side);

            const dx = pos.x - worldX;
            const dy = pos.y - worldY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < SNAP_DISTANCE) {
                return { type: "attached", cardId: card.id, anchor: side };
            }
        }
    }
    return null;
}

export const getControlOffset = (anchor: string | null, distance: number) => {
    if (!anchor) return { x: 0, y: 0 };

    switch (anchor) {
        case "top":
            return { x: 0, y: -distance };
        case "right":
            return { x: distance, y: 0 };
        case "bottom":
            return { x: 0, y: distance };
        case "left":
            return { x: -distance, y: 0 };
        default:
            return { x: 0, y: 0 };
}
};

export const getBezierPoint = (
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) => {
  const mt = 1 - t;

  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y,
  };
};