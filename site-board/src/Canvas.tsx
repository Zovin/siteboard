import { useEffect, useRef, useState } from "react";
import { type Arrow, type Item, type Point, type InteractionMode } from "./types/item";
import { Card } from "./components/Card";
import { Arrows } from "./components/Arrows";

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


    // for pointer movement / grid movement
    const moveGridEnabledRef = useRef(false);
    // sets the state for when an arrow is being created
    // used for onCursorMove
    
    const arrowIdRef = useRef<null | string>(null);
    // const currentInteractionModeRef = useRef<InteractionMode>("idle");
    
    // const updateInteractionMode = (mode: InteractionMode) => {
    //     currentInteractionModeRef.current = mode;
    // }

    const lastMousePositionRef = useRef<Point>(null);

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
        setArrows([...arrows, arrow]);
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
        moveGridEnabledRef.current = true;
    }

    const onMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!lastMousePositionRef.current) {
            lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
            return;
        }

        if (moveGridEnabledRef.current) {
            const dx = e.clientX - lastMousePositionRef.current.x;
            const dy = e.clientY - lastMousePositionRef.current.y;
            lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
            const zoom = zoomRef.current;
    
            curPosRef.current.x -= dx / zoom;
            curPosRef.current.y -= dy / zoom;
    
            draw();
            transformItems();
        } else if (arrowIdRef.current) {
            const zoom = zoomRef.current;
            const worldX = e.clientX / zoom + curPosRef.current.x;
            const worldY = e.clientY / zoom + curPosRef.current.y;

            const arrow = arrows.find(a => a.id === arrowIdRef.current);
            if (!arrow) return;


            arrow.to.x = worldX;
            arrow.to.y = worldY;

            setArrows([...arrows]);
        }
    }

    const onMouseUp = () => {
        if (moveGridEnabledRef.current) {
            moveGridEnabledRef.current = false;
            if (canvasRef.current) canvasRef.current.style.cursor = "default";
        } else if (arrowIdRef.current != null) {
            arrowIdRef.current = null;
        }
    }

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
            value: ""
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

    useEffect(() => {
        const handleMouseUp = () => {
            if (moveGridEnabledRef.current) {
              moveGridEnabledRef.current = false;
                if (canvasRef.current) canvasRef.current.style.cursor = "default";
            } else if (arrowIdRef.current) {
                arrowIdRef.current = null;
            }
            lastMousePositionRef.current = null;
        }

        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
        };
    })

  return (
    <div style={{ width: "100%", height: "100vh", display: "block", overflow: "hidden", position: "relative",  }}>
        <canvas 
            ref={canvasRef} 
            style={{ width: "100%", height: "100%", display: "block", position: "absolute",}}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
        />

        <div
            ref={arrowsLayerRef}
            style={{  
                position: "absolute",
                transformOrigin: "top left",
                zIndex: 2,
                pointerEvents: "none",
                overflow: "visible"
            }}
        >
            <Arrows items={items} arrows={arrows}/>
        </div>

        <div
            ref = {itemsLayerRef}
            style={{  
                position: "absolute",
                transformOrigin: "top left",
                zIndex: 1,
            }}
        >

            {items.map(item => (
                <Card
                    key={item.id}
                    card={item}
                    onUpdate={updateCard}
                    getZoom={getZoom}
                    removeCard={removeCard}
                    addArrow={createArrow}
                />
            ))}
        </div>
    </div>
  );
}
