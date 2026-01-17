import { useRef } from "react";
import type { Item, Point } from "../types/item";

type Props = {
    card: Item;
    onUpdate: (card: Item) => void;
    getZoom: () => number;
    removeCard: (cardId: number) => void;
}

export function Card({ card, onUpdate, getZoom, removeCard }: Props) {

    const resizingRef = useRef<boolean>(false);
    const moveRef = useRef<boolean>(false);
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
        if (card.type === "input") {
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
                style={{ 
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    caretColor: "white",
                    fontSize: "20px",
                }}
            />
        )
    } else {
        content = (
            <iframe
                src={withHttps(card.value)}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none",
                }}
            />
        );
    }

    const resizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();

        console.log(`resize starting mouse position = ${e.clientX} , ${e.clientY}`);

        resizingRef.current = true;
        lastMousePositionRef.current = {
            x: e.clientX,
            y: e.clientY,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    const resizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!resizingRef.current || !lastMousePositionRef.current) return;

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
        if (!resizingRef.current || !cardRef.current) return;

        resizingRef.current = false;

        onUpdate({
            ...card,
            w: card.w + totalResizeRef.current.w,
            h: card.h + totalResizeRef.current.h,
        })

        totalResizeRef.current = {w: 0, h: 0};
    }

    const movePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();

        moveRef.current = true;
        lastMousePositionRef.current = {
            x: e.clientX,
            y: e.clientY,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    const movePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!moveRef.current || !lastMousePositionRef.current || !totalMovementRef.current) return;

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
        if (!moveRef.current || !totalMovementRef.current) return;
        moveRef.current = false;

        const dx = totalMovementRef.current.x;
        const dy = totalMovementRef.current.y;

        const cardDiv = cardRef.current!;
        onUpdate({ ...card, x: card.x + dx, y: card.y + dy });
        cardDiv.style.transform = "translate(0px, 0px)";
        totalMovementRef.current = { x: 0, y: 0};
    }

    return (
        <div            
            ref={cardRef}
            style={{
                position: "absolute",
                left: card.x,
                top: card.y,
                width: card.w,
                height: card.h,
                zIndex: card.z,
                boxSizing: "border-box",
                border: card.type === "iframe" ? "3px solid gray" : undefined,
                background: card.type === "iframe" ? "#fff" : undefined,
                cursor: "all-scroll",
                transform: "translate(0px, 0px)",
            }}
            onPointerDown={movePointerDown}
            onPointerMove={movePointerMove}
            onPointerUp={movePointerUp}
        >
            {card.type === "iframe" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 7,
                        background: "gray",
                        cursor: "all-scroll",
                        zIndex: 2,
                    }}
                    onPointerDown={movePointerDown}
                    onPointerMove={movePointerMove}
                    onPointerUp={movePointerUp}
                >

                </div>
            )}

            {content}

            <div
                style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 6,
                    height: 6,
                    background: "#666",
                    cursor: "nwse-resize"
                }}
                onPointerDown={resizePointerDown}
                onPointerMove={resizePointerMove}
                onPointerUp={resizePointerUp}
            />
        </div>
    )
}