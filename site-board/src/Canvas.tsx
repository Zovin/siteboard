import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
};

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const curPosRef = useRef<Point>({x: 5000, y: 40});

    const spacingRef = useRef(50);

    // for pointer movement / grid movement
    const moveGridEnabledRef = useRef(false);
    const lastMousePositionRef = useRef<Point>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        
        const size = canvas.getBoundingClientRect();
        console.log(size);
        canvas.width = Math.round(size.width);
        canvas.height = Math.round(size.height);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const startX = curPosRef.current.x;
        const startY = curPosRef.current.y;

        const spacing = spacingRef.current;

        let x = (Math.ceil(startX / spacing) * spacing) - startX;
        let y = (Math.ceil(startY / spacing) * spacing) - startY;
        const endX = x + canvas.width;
        const endY = y + canvas.height;

        while (x < endX) {
            ctx.moveTo(x,0);
            ctx.lineTo(x, endY);
            x += spacing;
        }

        while (y < endY) {
            ctx.moveTo(0, y);
            ctx.lineTo(endX, y);
            y += spacing;
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

        curPosRef.current.x -= dx;
        curPosRef.current.y -= dy;

        draw();

    }

    const onMouseUp = () => {
        moveGridEnabledRef.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = "default";
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
        />
    </div>
  );
}
