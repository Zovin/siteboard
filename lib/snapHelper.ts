import type { Anchor, ArrowEnd, Item } from "@/types/item"

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
