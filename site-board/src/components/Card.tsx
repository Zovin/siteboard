import { useRef } from "react";
import type { Item, Point } from "../types/item";

type Props = {
    card: Item;
    onUpdate: (card: Item) => void;
    getZoom: () => number;
}

export function Card({ card, onUpdate, getZoom }: Props) {

    const resizingRef = useRef<boolean>(false);
    const moveRef = useRef<boolean>(false);
    const lastMousePositionRef = useRef<Point>({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const totalMovementRef = useRef<Point>({ x: 0, y: 0 });

    function withHttps(url: string) {
        if (!/^https?:\/\//i.test(url)) {
            return "https://" + url;
        }   
        return url;
    }

    let content;

    // initial 
    if (card.type == "input") {
        content = (
            <input
                autoFocus
                value={card.value}
                onChange={(e) => onUpdate({...card, value: e.target.value})}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && card.value != "") {
                        onUpdate({...card, type: "iframe"});
                    }
                }}
                style={{ 
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none"
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
        )
    }

    const resizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();

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


        const cardDiv = cardRef.current!;
        cardDiv.style.width = `${(cardDiv.offsetWidth + dx) * zoom}px`;
        cardDiv.style.height = `${(cardDiv.offsetHeight + dy) * zoom}px`;
    }

    const resizePointerUp = () => {
        if (!resizingRef.current || !cardRef.current) return;

        resizingRef.current = false;

        const cardDiv = cardRef.current;

        onUpdate({
            ...card,
            w: cardDiv.offsetWidth / getZoom(),
            h: cardDiv.offsetHeight / getZoom(),
        })
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
        // cardDiv.style.left = `${(card.x + totalMovementRef.current.x) * zoom}px`;
        // cardDiv.style.top = `${(card.y + totalMovementRef.current.y) * zoom}px`;
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
                border: "4px solid #aaa",
                background: "#fff",
                boxSizing: "border-box",
                cursor: "all-scroll",
                transform: "translate(0px, 0px)",
            }}
            onPointerDown={movePointerDown}
            onPointerMove={movePointerMove}
            onPointerUp={movePointerUp}
        >
            {content}

            <div
                style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 6,
                    height: 6,
                    background: "#666",
                    // opacity: 0,
                    cursor: "nwse-resize"
                }}
                onPointerDown={resizePointerDown}
                onPointerMove={resizePointerMove}
                onPointerUp={resizePointerUp}
            />
        </div>
    )
}