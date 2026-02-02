import React from "react";
import type { Item, Arrow, Anchor } from "../types/item"
import './Arrows.css'

type Props = {
    items: Item[];
    arrows: Arrow[];
    moveArrow: (arrow: Arrow) => void;
    
}

export function Arrows({items, arrows, moveArrow}: Props) {
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
        <svg className="arrows-svg">
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
                if (arrow.to.type == "attached") {
                    const toItem = findItem(arrow.to.cardId);
                    if (!toItem) return null
                    to = getAnchorPosition(toItem, arrow.to.anchor);
                } else if (arrow.to.type == "free") {
                    to = {x: arrow.to.x, y: arrow.to.y}
                } else {
                    return null
                }

                const offset = 5; // pixels in front of arrow tip
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1; // avoid div by 0
                const offsetX = (dx / len) * offset;
                const offsetY = (dy / len) * offset;

                return (
                    <React.Fragment key={arrow.id}>
                        <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        className="arrow-line"
                        markerEnd="url(#arrowhead)"
                        />
                        <circle
                        className="arrow-endpoint"
                        cx={to.x + offsetX}
                        cy={to.y + offsetY}
                        r={5}
                        fill="white"
                        stroke="blue"
                        onPointerDown={() => moveArrow(arrow)}
                        />
                    </React.Fragment>
                );
            })}
        </svg>
    )
}