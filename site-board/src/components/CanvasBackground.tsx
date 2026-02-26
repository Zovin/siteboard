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
    apiRef: React.RefObject<{
        zoomIn: () => void;
        zoomOut: () => void;
        resetView: () => void;
    } | null>;
    onZoomChange?: (zoom: number) => void;
}

export function CanvasBackground({
    camera,
    zoomRef,
    interactionMode,
    addCard,
    transformItems,
    setFocusItem,
    apiRef,
    onZoomChange
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

    useEffect(() => {
        const handleResize = () => {
            draw();            // redraw grid at new size
            transformItems();  // keeps DOM layer aligned with camera
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // --- Handle DPR (THIS FIXES RESIZE WEIRDNESS) ---
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const width = rect.width;
        const height = rect.height;

        const cameraX = camera.current.x;
        const cameraY = camera.current.y;
        const zoom = zoomRef.current;
        const spacing = spacingRef.current;

        // --- Clear background ---
        ctx.fillStyle = "hsl(240 10% 6%)";
        ctx.fillRect(0, 0, width, height);

        // --- Visible world bounds ---
        const worldLeft = cameraX;
        const worldTop = cameraY;
        const worldRight = cameraX + width / zoom;
        const worldBottom = cameraY + height / zoom;

        // --- First grid line in world space ---
        const startX = Math.floor(worldLeft / spacing) * spacing;
        const startY = Math.floor(worldTop / spacing) * spacing;

        const dotRadius = Math.max(1, 4 * zoom);

        ctx.fillStyle = "hsl(240 5% 20%)";

        for (let wx = startX; wx <= worldRight; wx += spacing) {
            for (let wy = startY; wy <= worldBottom; wy += spacing) {

            const screenX = (wx - cameraX) * zoom;
            const screenY = (wy - cameraY) * zoom;

            ctx.beginPath();
            ctx.arc(screenX, screenY, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            }
        }
    };

    const zoomAtScreenPoint = (
        screenX: number,
        screenY: number,
        zoomFactor: number
    ) => {
        const oldZoom = zoomRef.current;

        const worldMouseX = camera.current.x + screenX / oldZoom;
        const worldMouseY = camera.current.y + screenY / oldZoom;

        let newZoom = oldZoom * zoomFactor;
        newZoom = Math.min(maxZoom, Math.max(minZoom, newZoom));

        // when zooming, we want the mouseX and mouseY value to still be the same, so we change the camera location instead.
        // (if the camera zooms in, we want to move the camera's world x postion to be closer to the mouse pointer and vice versa)
        // currently CameraX = worldMouseX - mouseX/oldZoom(this gives the real distance of the mouse to left corner), 
        // so to get the cameraX with new zoom, we do
        // CameraX = worldMouseX - mouseX/newZoom

        camera.current.x = worldMouseX - screenX / newZoom;
        camera.current.y = worldMouseY - screenY / newZoom;

        zoomRef.current = newZoom;
        onZoomChange?.(newZoom);

        draw();
        transformItems();
    };

    const zoomFromCenter = (zoomFactor: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        zoomAtScreenPoint(centerX, centerY, zoomFactor);
    };

    const resetView = () => {
        camera.current = { x: 0, y: 0 };
        zoomRef.current = 1;
        draw();
        transformItems();
        onZoomChange?.(1);
    };

    useEffect(() => {
        if (apiRef) {
            apiRef.current = {
                zoomIn: () => zoomFromCenter(1.1),
                zoomOut: () => zoomFromCenter(0.9),
                resetView,
            };
        }
    }, [apiRef]);

    const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

        zoomAtScreenPoint(mouseX, mouseY, zoomFactor);
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
    );

}
    
