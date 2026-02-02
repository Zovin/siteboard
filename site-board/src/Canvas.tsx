import { useEffect, useRef, useState } from "react";
import { type Arrow, type Item, type Point, type InteractionMode } from "./types/item";
import { Card } from "./components/Card";
import { Arrows } from "./components/Arrows";
import './Canvas.css'
import { findSnapTarget } from "./helper/snapHelper";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const curPosRef = useRef<Point>({x: 0, y: 0});

    const spacingRef = useRef(100);

    const zoomRef = useRef(1);
    const minZoom = 0.2;
    const maxZoom = 8;
    const getZoom = () => {
        return zoomRef.current;
    }
    
    const arrowIdRef = useRef<null | string>(null);
    const lastMousePositionRef = useRef<Point>(null);

    const [focusedItemId, setFocusedItemId] = useState<number | string | null>(null);
    const getCurrentFocusItem = () => {
        return focusedItemId;
    }
    const setFocusItem = (id: number | string | null) => {
        console.log("set to" + id)
        setFocusedItemId(id);
    }

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

    const moveArrow = (arrow: Arrow) => {
        arrowIdRef.current = arrow.id;
        updateInteractionMode("drawing-arrow");
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
        const dotRadius = 3 * zoom;

        const worldFirstX = Math.ceil(worldX / spacing) * spacing;
        const worldFirstY = Math.ceil(worldY / spacing) * spacing;

        const endX = canvas.width;
        const endY = canvas.height;

        ctx.fillStyle = `rgba(224,224,224, ${zoom / 1.5})`;

        for (let x = (worldFirstX - worldX) * zoom; x <= endX; x += zoomSpacing) {
            for (let y = (worldFirstY - worldY) * zoom; y <= endY; y += zoomSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    const onMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        setFocusItem(null);
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

                const snap = findSnapTarget(worldX, worldY, items);
                
                updatedArrows[arrowIndex] = {
                    ...updatedArrows[arrowIndex],
                    to: snap ?? { type: "free", x: worldX, y: worldY }
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
    }, []);

    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {

            console.log(`${getCurrentFocusItem()}`);
            if (!getCurrentFocusItem()) return;
            const id = getCurrentFocusItem()?.toString();


            if (e.key === "Delete" || e.key === "Backspace") {
                console.log("test")
                const arrowToRemove = arrows.find(arrow => arrow.id === id);
                if (!arrowToRemove) return;
                removeArrow(arrowToRemove);
                setFocusItem(null);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedItemId, arrows]);

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

    const removeArrow = (arrowToRemove: Arrow) => {
        const updatedArrows = arrows.filter(a => a.id !== arrowToRemove.id);
        setArrows(updatedArrows);
        localStorage.setItem("arrows", JSON.stringify(updatedArrows));

        // Restore the 'from' anchor
        const fromItem = items.find(i => i.id === arrowToRemove.from.cardId);
        if (fromItem && !fromItem.anchors.includes(arrowToRemove.from.anchor)) {
            const updatedFromItem = {
                ...fromItem,
                anchors: [...fromItem.anchors, arrowToRemove.from.anchor]
            };
            updateCard(updatedFromItem);
        }
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
            <Arrows 
                items={items} 
                arrows={arrows} 
                moveArrow={moveArrow} 
                getFocusItem={getCurrentFocusItem}
                setFocusItem={setFocusItem}
            />
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
                    getFocusItem={getCurrentFocusItem}
                    setFocusItem={setFocusItem}
                />
            ))}
        </div>
    </div>
  );
}
