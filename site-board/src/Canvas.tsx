import { useEffect, useRef, useState } from "react";
import { type Arrow, type Item, type Point, type InteractionMode } from "./types/item";
import { Card } from "./components/Card";
import { Arrows } from "./components/Arrows";
import './Canvas.css'

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const curPosRef = useRef<Point>({x: 0, y: 0});

    const spacingRef = useRef(50);

    const zoomRef = useRef(1);
    const minZoom = 0.5;
    const maxZoom = 5;
    const getZoom = () => {
        return zoomRef.current;
    }
    
    const arrowIdRef = useRef<null | string>(null);
    const lastMousePositionRef = useRef<Point>(null);

    const currentInteractionModeRef = useRef<InteractionMode>("idle");
    const updateInteractionMode = (mode: InteractionMode) => {
        currentInteractionModeRef.current = mode;
    }
    const getInteractionMode = () => {
        return currentInteractionModeRef.current;
    }

    // using state since we want to reload everytime we add an item
    const [items, setItems] = useState<Item[]>(() => {
        const stored = localStorage.getItem("items");
        return stored ? JSON.parse(stored) : [];
    });
    const [arrows, setArrows] = useState<Arrow[]>(() => {
        const stored =  localStorage.getItem("arrows");
        return stored ? JSON.parse(stored): [];
    })

    const z = useRef(1);
    const itemsLayerRef = useRef<HTMLDivElement>(null);
    const arrowsLayerRef = useRef<HTMLDivElement>(null);

    const cardIdCounter = useRef<number>(Number(localStorage.getItem("idCount") ?? 0));

    const transformItems = () => {
        const itemsLayer = itemsLayerRef.current;
        const arrowsLayer = arrowsLayerRef.current;
        if (!itemsLayer || !arrowsLayer) return;

        const zoom = zoomRef.current;
        const cameraX = curPosRef.current.x;
        const cameraY = curPosRef.current.y;

        itemsLayer.style.transform = `scale(${zoom}) translate(${-cameraX}px, ${-cameraY}px)`;
        arrowsLayer.style.transform = `scale(${zoom}) translate(${-cameraX}px, ${-cameraY}px)`;
    };


    const createArrow = (arrow: Arrow) => {
        if (arrowIdRef.current != null) return;
        const newArrows = [...arrows, arrow];
        
        setArrows(newArrows);
        localStorage.setItem("arrows", JSON.stringify(newArrows));
        
        arrowIdRef.current = arrow.id;
    }

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const size = canvas.getBoundingClientRect();
        canvas.width = Math.round(size.width);
        canvas.height = Math.round(size.height);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const worldX = curPosRef.current.x;
        const worldY = curPosRef.current.y;

        const zoom = zoomRef.current;

        const spacing = spacingRef.current;
        const zoomSpacing = spacingRef.current * zoom;

        const worldFirstX = Math.ceil(worldX / spacing) * spacing;  // gets the 
        const worldFirstY = Math.ceil(worldY / spacing) * spacing;

        let x = (worldFirstX - worldX) * zoom;
        let y = (worldFirstY - worldY) * zoom;
        const endX = canvas.width;
        const endY = canvas.height;


        ctx.beginPath()

        while (x < endX) {
            ctx.moveTo(x,0);
            ctx.lineTo(x, endY);
            x += zoomSpacing;
        }

        while (y < endY) {
            ctx.moveTo(0, y);
            ctx.lineTo(endX, y);
            y += zoomSpacing;
        }

        ctx.strokeStyle = "rgba(224, 224, 224, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    const onMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
        currentInteractionModeRef.current = "camera-move";
    }

    const onMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!lastMousePositionRef.current) {
            lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
            return;
        }

        const zoom = zoomRef.current;

        switch (currentInteractionModeRef.current) {
            case "camera-move":
                const dx = e.clientX - lastMousePositionRef.current.x;
                const dy = e.clientY - lastMousePositionRef.current.y;
                
                lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
        
                curPosRef.current.x -= dx / zoom;
                curPosRef.current.y -= dy / zoom;
        
                draw();
                transformItems();
                break;

            case "drawing-arrow":
                if (!arrowIdRef.current) return;
                const worldX = e.clientX / zoom + curPosRef.current.x;
                const worldY = e.clientY / zoom + curPosRef.current.y;

                const updatedArrows = [...arrows];

                const arrowIndex = arrows.findIndex(a => a.id === arrowIdRef.current);
                if (arrowIndex === -1) return;
                
                updatedArrows[arrowIndex] = {
                    ...updatedArrows[arrowIndex],
                    to: { x: worldX, y: worldY }
                };

                setArrows(updatedArrows);
                localStorage.setItem("arrows", JSON.stringify(updatedArrows));
                break;

            default: 
                break;
        }
    }

    // onMouseUp has to be attached to window since it might not be started in the canvas
    // but it can end in the canvas, in that case, the interaction doesn't get detected here.
    // so attach it to window so it always gets detected.
    useEffect(() => {
        const handleMouseUp = () => {
            switch (currentInteractionModeRef.current) {
                case "camera-move":
                    if (canvasRef.current) canvasRef.current.style.cursor = "default";
                    break;

                case "drawing-arrow":
                    arrowIdRef.current = null;
                    break;

                default:
                    break;
            }

            updateInteractionMode("idle");
        }

        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
        };
    })

    const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // prevent scrolling down

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasLocation = canvas.getBoundingClientRect();
        // current location of the mouse relative to the screen
        const mouseX = e.clientX - canvasLocation.left;
        const mouseY = e.clientY - canvasLocation.top;

        const oldZoom = zoomRef.current;

        const worldMouseX = curPosRef.current.x + mouseX / oldZoom;
        const worldMouseY = curPosRef.current.y + mouseY / oldZoom;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;    // zoom in or zoom out by 10% every time, not a flat number
        let newZoom = oldZoom * zoomFactor;
        newZoom = Math.min(maxZoom, Math.max(minZoom, newZoom)); // limit the zoom to either minZoom or maxZoom

        // when zooming, we want the mouseX and mouseY value to still be the same, so we change the camera location instead.
        // (if the camera zooms in, we want to move the camera's world x postion to be closer to the mouse pointer and vice versa)
        // currently CameraX = worldMouseX - mouseX/oldZoom(this gives the real distance of the mouse to left corner), 
        // so to get the cameraX with new zoom, we do
        // CameraX = worldMouseX - mouseX/newZoom
        curPosRef.current.x = worldMouseX - mouseX / newZoom;
        curPosRef.current.y = worldMouseY - mouseY / newZoom;

        zoomRef.current = newZoom;

        draw();
        transformItems();
    }

    const onDoubleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasLocation = canvas.getBoundingClientRect();

        const mouseX = e.clientX - canvasLocation.left;
        const mouseY = e.clientY - canvasLocation.top;

        const CameraLocation = curPosRef.current;
        const itemWorldX = CameraLocation.x + mouseX / zoomRef.current;
        const itemWorldY = CameraLocation.y + mouseY / zoomRef.current;

        setItems([...items, {
            x: itemWorldX,
            y: itemWorldY,
            w: 200,
            h: 40,
            z: z.current,
            id: cardIdCounter.current,

            type: "input",
            value: "",
            anchors: ["top", "right", "bottom", "left"]
        }])

        z.current += 1;
        cardIdCounter.current += 1;
        localStorage.setItem("idCount", `${cardIdCounter.current + 1}`);
    }

    const updateCard = (updatedCard: Item) => {
        const updatedItems = items.map((item) => item.id == updatedCard.id ? updatedCard : item)
        setItems(updatedItems);
        localStorage.setItem("items", JSON.stringify(updatedItems));
    }

    const removeCard = (cardId: number) => {
        const updatedCards = items.filter(c => c.id != cardId);
        setItems(updatedCards);
        localStorage.setItem("items", JSON.stringify(updatedCards));
    }

    useEffect(() => {
        draw();
    }, []);

  return (
    <div className="canvas-container">
        <canvas 
            ref={canvasRef} 
            className="canvas-layer"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
        />

        <div ref={arrowsLayerRef} className="arrows-layer">
            <Arrows items={items} arrows={arrows}/>
        </div>

        <div ref = {itemsLayerRef} className="items-layer">
            {items.map(item => (
                <Card
                    key={item.id}
                    card={item}
                    onUpdate={updateCard}
                    getZoom={getZoom}
                    removeCard={removeCard}
                    addArrow={createArrow}
                    updateInteractionMode={updateInteractionMode}
                    getInteractionMode={getInteractionMode}
                />
            ))}
        </div>
    </div>
  );
}
