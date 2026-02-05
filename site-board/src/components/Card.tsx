import { useRef } from "react";
import type { Item, Point, Anchor, Arrow, InteractionMode } from "../types/item";
import "./Card.css"
import { getAnchorPosition } from "../helper/snapHelper";

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
            />
        );
    }

    const resizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();

        updateInteractionMode("resizing");
        lastMousePositionRef.current = {
            x: e.clientX,
            y: e.clientY,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    const resizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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

        console.log("moving started");
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
            className={`card-div ${card.type === "iframe" ? "card-div-iframe": ""}`}
            style={{
                left: card.x,
                top: card.y,
                width: card.w,
                height: card.h,
                zIndex: card.z
            }}
            onPointerDown={movePointerDown}
            onPointerMove={movePointerMove}
            onPointerUp={movePointerUp}
        >

            {getFocusItem() === card.id && card.type === "iframe" && card.anchors.map(side => (
                <div 
                    key={side}
                    className={`anchor anchor-${side}`}
                    onPointerDown={() => onAnchorClick(side)}
                />
            ))}

            {card.type === "iframe" && (
                <div
                    className="card-header"
                    onPointerDown={movePointerDown}
                    onPointerMove={movePointerMove}
                    onPointerUp={movePointerUp}
                >
                    <button
                        onClick={removeCurrentCard}
                        className="card-close-btn"
                    >
                        ✕
                    </button>
                </div>
            )}

            {content}

            <div
                className="card-resize-handle"
                onPointerDown={resizePointerDown}
                onPointerMove={resizePointerMove}
                onPointerUp={resizePointerUp}
            />
        </div>
    )
}