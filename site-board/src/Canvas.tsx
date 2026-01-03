import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
};

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const curPosRef = useRef<Point>({x: 5000, y: 40});

    const spacingRef = useRef(50);

    const zoomRef = useRef(1);
    const minZoom = 0.5;
    const maxZoom = 6;

    // for pointer movement / grid movement
    const moveGridEnabledRef = useRef(false);
    const lastMousePositionRef = useRef<Point>(null);

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

        ctx.strokeStyle = "#e0e0e0";
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
        if (!moveGridEnabledRef.current || !lastMousePositionRef.current) return;

        const dx = e.clientX - lastMousePositionRef.current.x;
        const dy = e.clientY - lastMousePositionRef.current.y;
        lastMousePositionRef.current = {x: e.clientX, y: e.clientY};

        const zoom = zoomRef.current;

        curPosRef.current.x -= dx / zoom;
        curPosRef.current.y -= dy / zoom;

        draw();

    }

    const onMouseUp = () => {
        moveGridEnabledRef.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = "default";
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
        // currently CameraX = worldMouseX - mouseX/oldZoom, so to get the cameraX with new zoom, we do
        // CameraX = worldMouseX - mouseX/newZoom
        curPosRef.current.x = worldMouseX - mouseX / newZoom;
        curPosRef.current.y = worldMouseY - mouseY / newZoom;

        zoomRef.current = newZoom;

        draw();
    }

    useEffect(() => {
        draw();
    }, []);

  return (
    <div style={{ width: "100%", height: "100vh", display: "block" }}>
        <canvas 
        ref={canvasRef} 
        style={{ width: "100%", height: "100%", display: "block"}}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onWheel={onWheel}
        />
    </div>
  );
}
