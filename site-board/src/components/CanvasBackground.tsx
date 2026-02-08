import React, { useEffect, useRef } from "react";
import { type Point, type InteractionMode } from "../types/item";

const canvasStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  position: "absolute",
  zIndex: 0,
};

type CanvasBackgroundProps = {
    camera: React.RefObject<Point>;
    zoomRef: React.RefObject<number>;
    interactionMode: React.RefObject<InteractionMode>;
    addCard: (worldX: number, worldY: number) => void;
    transformItems: () => void;
    setFocusItem: (id: number | string | null) => void;
}

export function CanvasBackground({
    camera,
    zoomRef,
    interactionMode,
    addCard,
    transformItems,
    setFocusItem
}: CanvasBackgroundProps
) {

    const spacingRef = useRef(100);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const lastMousePositionRef = useRef<Point>(null);
    const minZoom = 0.2;
    const maxZoom = 8;

    useEffect(() => {
        draw();
    }, []);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = canvas.getBoundingClientRect();
        canvas.width = Math.round(size.width);
        canvas.height = Math.round(size.height);

        const worldX = camera.current.x;
        const worldY = camera.current.y;

        const zoom = zoomRef.current;

        const spacing = spacingRef.current;
        const zoomSpacing = spacing * zoom;
        const dotRadius = 3 * zoom;

        const worldFirstX = Math.ceil(worldX / spacing) * spacing;
        const worldFirstY = Math.ceil(worldY / spacing) * spacing;

        const endX = canvas.width;
        const endY = canvas.height;

        // --- Hardcoded background and dot colors ---
        const backgroundColor = "hsl(240, 10%, 6%)"; // dark blue background
        // const dotColor = "hsl(240, 5%, 20%)";        // slightly lighter dark dots

        // Fill background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw dot grid
        ctx.fillStyle = `hsl(240, 5%, 20%, ${Math.min(zoom / 1.5, 1)})`; // optional alpha based on zoom

        for (let x = (worldFirstX - worldX) * zoom; x <= endX; x += zoomSpacing) {
            for (let y = (worldFirstY - worldY) * zoom; y <= endY; y += zoomSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };


    const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // prevent scrolling down

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasLocation = canvas.getBoundingClientRect();
        // current location of the mouse relative to the screen
        const mouseX = e.clientX - canvasLocation.left;
        const mouseY = e.clientY - canvasLocation.top;

        const oldZoom = zoomRef.current;

        const worldMouseX = camera.current.x + mouseX / oldZoom;
        const worldMouseY = camera.current.y + mouseY / oldZoom;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;    // zoom in or zoom out by 10% every time, not a flat number
        let newZoom = oldZoom * zoomFactor;
        newZoom = Math.min(maxZoom, Math.max(minZoom, newZoom)); // limit the zoom to either minZoom or maxZoom

        // when zooming, we want the mouseX and mouseY value to still be the same, so we change the camera location instead.
        // (if the camera zooms in, we want to move the camera's world x postion to be closer to the mouse pointer and vice versa)
        // currently CameraX = worldMouseX - mouseX/oldZoom(this gives the real distance of the mouse to left corner), 
        // so to get the cameraX with new zoom, we do
        // CameraX = worldMouseX - mouseX/newZoom
        camera.current.x = worldMouseX - mouseX / newZoom;
        camera.current.y = worldMouseY - mouseY / newZoom;

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

        const CameraLocation = camera.current;
        const itemWorldX = CameraLocation.x + mouseX / zoomRef.current;
        const itemWorldY = CameraLocation.y + mouseY / zoomRef.current;
        addCard(itemWorldX, itemWorldY);
    }

    const onMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        setFocusItem(null);
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
        interactionMode.current = "camera-move";
    }

    const onMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (interactionMode.current !== "camera-move") return;

        if (!lastMousePositionRef.current) {
            lastMousePositionRef.current = {x: e.clientX, y: e.clientY};
            return;
        }

        const dx = e.clientX - lastMousePositionRef.current.x;
        const dy = e.clientY - lastMousePositionRef.current.y;
        
        lastMousePositionRef.current = {x: e.clientX, y: e.clientY};

        camera.current.x -= dx / zoomRef.current;
        camera.current.y -= dy / zoomRef.current;

        draw();
        transformItems();
    }

    const onMouseUp = () => {
        if (!canvasRef.current) return;
            
        canvasRef.current.style.cursor = "default";
        // updateInteractionMode("idle");
        interactionMode.current = "idle";
    }
    
    return (
        <canvas 
            ref={canvasRef} 
            style={canvasStyle}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
        />
    )

}
    
