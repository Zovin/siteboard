import { useRef } from "react";
import type { Item, Point, Anchor, Arrow, InteractionMode } from "../types/item";
import "./Card.css"
import { getAnchorPosition } from "../helper/snapHelper";
import { cn } from "../lib/utils";

import {
  X,
  ExternalLink,
  GripVertical,
  Maximize2,
//   Plus,
//   Minus,
} from "lucide-react"

type Props = {
    card: Item;
    onUpdate: (card: Item) => void;
    getZoom: () => number;
    removeCard: (cardId: number) => void;
    addArrow: (arrow: Arrow) => void;
    updateInteractionMode: (mode: InteractionMode) => void;
    getInteractionMode: () => InteractionMode;
    getFocusItem: () => number | string | null;
    setFocusItem: (id: number | string) => void;
}

export function Card({ card, onUpdate, getZoom, removeCard, addArrow, updateInteractionMode, getInteractionMode, getFocusItem, setFocusItem }: Props) {
    const lastMousePositionRef = useRef<Point>({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    const totalMovementRef = useRef<Point>({ x: 0, y: 0 });
    const totalResizeRef = useRef({ w: 0, h: 0 });

    const withHttps = (url: string) => {
        if (!/^https?:\/\//i.test(url)) {
            return "https://" + url;
        }   
        return url;
    }

    const removeInputCard = () => {
        if (card.type === "input" && card.value === "") {
            removeCard(card.id);
        }
    }

    const removeCurrentCard = () => {
        removeCard(card.id);
    }  

    let content;

    if (card.type === "input") {
        content = (
            <input
                autoFocus
                value={card.value}
                onChange={(e) => onUpdate({...card, value: e.target.value})}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && card.value != "") {
                        onUpdate({...card, type: "iframe", w: 800, h: 600});
                    }
                }}
                onBlur={removeInputCard}
                className="card-input"
            />
        )
    } else {
        content = (
            <iframe
                src={withHttps(card.value)}
                className="card-iframe"
                sandbox="allow-scripts allow-same-origin allow-forms"
            />
        );
    }

    const resizePointerDown = (e: React.PointerEvent<SVGElement>) => {
        e.stopPropagation();

        updateInteractionMode("resizing");
        lastMousePositionRef.current = {
            x: e.clientX,
            y: e.clientY,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    const resizePointerMove = (e: React.PointerEvent<SVGElement>) => {
        if (getInteractionMode() !== "resizing" || !lastMousePositionRef.current) return;

        const zoom = getZoom();

        const dx = (e.clientX - lastMousePositionRef.current.x) / zoom;
        const dy = (e.clientY - lastMousePositionRef.current.y) / zoom;

        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };

        totalResizeRef.current.w += dx;
        totalResizeRef.current.h += dy;

        const cardDiv = cardRef.current!;
        cardDiv.style.width = `${card.w + totalResizeRef.current.w}px`;
        cardDiv.style.height = `${(card.h + totalResizeRef.current.h)}px`;
    }

    const resizePointerUp = () => {
        if (getInteractionMode() !== "resizing" || !cardRef.current) return;

        updateInteractionMode("idle");
        
        onUpdate({
            ...card,
            w: card.w + totalResizeRef.current.w,
            h: card.h + totalResizeRef.current.h,
        })

        totalResizeRef.current = {w: 0, h: 0};
    }

    const movePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (getFocusItem() !== card.id) setFocusItem(card.id);
        if (getInteractionMode() === "drawing-arrow") return    // this is to prevent moving and drawing arrow at the same time
        e.stopPropagation();

        updateInteractionMode("dragging-card");

        lastMousePositionRef.current = {
            x: e.clientX,
            y: e.clientY,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    const movePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (getInteractionMode() !== "dragging-card" || !lastMousePositionRef.current || !totalMovementRef.current) return


        const zoom = getZoom();

        const dx = (e.clientX - lastMousePositionRef.current.x) / zoom;
        const dy = (e.clientY - lastMousePositionRef.current.y) / zoom;

        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        
        totalMovementRef.current.x += dx;
        totalMovementRef.current.y += dy;

        const cardDiv = cardRef.current!;
        cardDiv.style.transform =
            `translate(${totalMovementRef.current.x}px, ${totalMovementRef.current.y}px)`;
    }

    const movePointerUp = () => {
        if (getInteractionMode() !== "dragging-card" || !totalMovementRef.current) return

        updateInteractionMode("idle");

        const dx = totalMovementRef.current.x;
        const dy = totalMovementRef.current.y;

        const cardDiv = cardRef.current!;
        onUpdate({ ...card, x: card.x + dx, y: card.y + dy });
        cardDiv.style.transform = "translate(0px, 0px)";
        totalMovementRef.current = { x: 0, y: 0};
    }

    const onAnchorClick = (side: Anchor) => {
        const updatedAnchors = card.anchors.filter((anchor) => anchor !== side);

        // remove anchor
        onUpdate({...card, anchors: updatedAnchors});

        addArrow({
            id: `${card.id}${side}`,
            from: {
                cardId: card.id,
                anchor: side
            },
            to: {...getAnchorPosition(card, side), type: "free"}
        });
        updateInteractionMode("drawing-arrow");
    }
    
    return (
        <div            
            ref={cardRef}
            className={cn(
                "card-div",
                "absolute select-none",
                "bg-card rounded-3xl",
                "border border-border/50",
                "shadow-lg shadow-black/5",
                "transition-shadow duration-200",
                "flex flex-col h-full",
                getFocusItem() === card.id &&
                "ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10",
                getInteractionMode() === "dragging-card" && "cursor-grabbing"
            )}
            style={{
                left: card.x,
                top: card.y,
                width: card.w,
                height: card.h,
                zIndex: card.z,
            }}
            onPointerDown={movePointerDown}
            onPointerMove={movePointerMove}
            onPointerUp={movePointerUp}
        >
            {getFocusItem() === card.id &&
            card.anchors.map((side) => (
                <button
                key={side}
                className={cn(
                    "absolute w-5 h-5 rounded-full",
                    "border-2 border-blue-500 bg-background",
                    "hover:bg-blue-500 hover:scale-125",
                    "transition-all duration-150",
                    `anchor-${side} anchor`,
                    "shadow-sm"
                )}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onAnchorClick(side)
                }}
                />
            ))}

            <div className="w-full h-full overflow-hidden rounded-3xl">
                {card.type === "iframe" && (
                    <div
                        className={cn(
                        "h-14 px-3 flex items-center gap-2",
                        "bg-muted border-b border-border/50",
                        "all-scroll active:all-scroll"
                        )}
                        onPointerDown={movePointerDown}
                        onPointerMove={movePointerMove}
                        onPointerUp={movePointerUp}
                    >
                        <GripVertical className="w-7.5 h-7.5 text-muted-foreground/50" />

                        <span className="flex-1 text-xl font-medium text-foreground/80 truncate">
                        {new URL(withHttps(card.value)).hostname}
                        </span>

                        <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                            e.stopPropagation()
                            window.open(withHttps(card.value), "_blank")
                            }}
                            className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-color hover:cursor-pointer"
                            title="Open in new tab"
                        >
                            <ExternalLink className="w-7.5 h-7.5" />
                        </button>

                        <button
                            onClick={(e) => {
                            e.stopPropagation()
                            removeCurrentCard()
                            }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors hover:cursor-pointer"
                            title="Delete"
                        >
                            <X className="w-7.5 h-7.5" />
                        </button>
                        </div>
                    </div>
                )}


                {content} {/* iframe goes here */}

                <div className="resize-handle absolute bottom-2 right-2 w-7.5 h-7.5 cursor-se-resize flex items-center justify-center">
                    <Maximize2 className="w-7.5 h-7.5 text-muted-foreground rotate-90"
                        onPointerDown={resizePointerDown}
                        onPointerMove={resizePointerMove}
                        onPointerUp={resizePointerUp}
                    />
                </div>
            </div>
        </div>
    )

}