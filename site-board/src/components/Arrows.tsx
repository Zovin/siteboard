import type { Item, Arrow } from "../types/item"
import './Arrows.css'
import { getAnchorPosition, getBezierPoint, getControlOffset } from "../helper/snapHelper";
import { X } from "lucide-react";

type Props = {
    items: Item[];
    arrows: Arrow[];
    moveArrow: (arrow: Arrow) => void;
    getFocusItem: () => number | string | null;
    setFocusItem: (id: number | string | null) => void;
    removeArrow : (arrowToRemove: Arrow) => void;
}

export function Arrows({items, arrows, moveArrow, getFocusItem, setFocusItem, removeArrow}: Props) {
    const findItem = (id: number) => items.find((item) => item.id === id);

    return (
        <svg className="arrows-svg pointer-events-none overflow-visible">

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

                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const controlDistance = Math.min(120, distance * 0.4);

                const fromOffset = getControlOffset(arrow.from.anchor, controlDistance);

                const toOffset =
                arrow.to.type === "attached"
                    ? getControlOffset(arrow.to.anchor, controlDistance)
                    : {
                        x: -dx * 0.4,
                        y: -dy * 0.4,
                };

                const cp1 = {
                    x: from.x + fromOffset.x,
                    y: from.y + fromOffset.y,
                };

                const cp2 = {
                    x: to.x + toOffset.x,
                    y: to.y + toOffset.y,
                };   

                const mid = getBezierPoint(0.5, from, cp1, cp2, to);

                const pathD = `
                M ${from.x} ${from.y}
                C ${cp1.x} ${cp1.y},
                    ${cp2.x} ${cp2.y},
                    ${to.x} ${to.y}
                `;

                return (
                    <g key={arrow.id} className="arrow-group">
                        <path
                            d={pathD}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={20}
                            onClick={() => setFocusItem(arrow.id)}
                        />

                        <path
                            d={pathD}
                            fill="none"
                            className={`arrow-path ${getFocusItem() === arrow.id ? "selected" : ""}`}
                            onClick={() => setFocusItem(arrow.id)}
                        />

                    {(() => {
                          const angle =
                            Math.atan2(to.y - cp2.y, to.x - cp2.x) * (180 / Math.PI);

                        return (
                            <g transform={`translate(${to.x}, ${to.y}) rotate(${angle})`}>
                            <polygon
                                points="0,0 -18,-9 -18,9"
                                className={
                                getFocusItem() === arrow.id
                                    ? "fill-blue-500"
                                    : "fill-slate-400"
                                }
                            />
                            </g>
                        );
                    })()}


                        {getFocusItem() === arrow.id && (
                            <path
                                d={pathD}
                                fill="none"
                                stroke="rgba(59,130,246,0.3)"
                                strokeWidth={8}
                                strokeLinecap="round"
                                className="pointer-events-none"
                            />
                        )}

                        {getFocusItem() === arrow.id && (
                            <circle
                                cx={to.x}
                                cy={to.y}
                                r={8}
                                fill="white"
                                stroke="blue"
                                strokeWidth={2}
                                onPointerDown={(e) => {
                                e.stopPropagation();
                                moveArrow(arrow);
                                }}
                            />
                        )}

                        {getFocusItem() === arrow.id && (
                            <g
                                transform={`translate(${mid.x}, ${mid.y}) scale(2)`}
                                className="pointer-events-auto cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeArrow(arrow);
                                }}
                            >

                                <circle
                                    r={10}
                                    fill="rgb(239,68,68)"
                                    className="drop-shadow-lg"
                                />

                                <g transform="translate(-7, -7)">
                                    <X size={14} color="white" strokeWidth={3} />
                                </g>
                            </g>
                        )}


                    </g>

                );
            })}
        </svg>
    )
}