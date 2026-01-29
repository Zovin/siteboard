import type { Item, Arrow, Anchor } from "../types/item"

type Props = {
    items: Item[];
    arrows: Arrow[];
}

export function Arrows({items, arrows}: Props) {
    const findItem = (id: number) => items.find((item) => item.id === id);

    const getAnchorPosition = (item: Item, anchor: Anchor) => {
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

    return (
        <svg
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 5,
                overflow: "visible"
            }}
        >
            {/* defines the arrowhead */}
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="white"/>
                </marker>
            </defs>
            {arrows.map((arrow) => {
                const fromItem = findItem(arrow.from.cardId);
                if (!fromItem) return null
                const from = getAnchorPosition(fromItem, arrow.from.anchor);
                
                let to;
                if (arrow.to.cardId && arrow.to.anchor) {
                    const toItem = findItem(arrow.to.cardId);
                    if (!toItem) return null
                    to = getAnchorPosition(toItem, arrow.to.anchor);
                } else if (arrow.to.x != null && arrow.to.y != null) {
                    to = {x: arrow.to.x, y: arrow.to.y}
                } else {
                    return null
                }

                console.log(`from {${from.x}, ${from.y}} to {${to.x}, ${to.y}}`)

                return (
                    <line
                        key={arrow.id}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="white"
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                    />
                )
            })}
        </svg>
    )

}