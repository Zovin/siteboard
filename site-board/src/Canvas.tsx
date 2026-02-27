import { useEffect, useRef, useState } from "react";
import { type Arrow, type Item, type Point, type InteractionMode } from "./types/item";
import { Card } from "./components/Card";
import { Arrows } from "./components/Arrows";
import './Canvas.css'
import { findSnapTarget } from "./helper/snapHelper";
import { CanvasBackground } from "./components/CanvasBackground";
import Toolbar from "./components/Toolbar";
import { HelpModal } from "./components/HelpModal";

export default function Canvas() {
    const curPosRef = useRef<Point>({x: 0, y: 0});

    const zoomRef = useRef(1);
    const getZoom = () => {
        return zoomRef.current;
    }
    const [zoom, setZoom] = useState(1);
    
    const arrowIdRef = useRef<null | string>(null);

    const [focusedItemId, setFocusedItemId] = useState<number | string | null>(null);
    const getCurrentFocusItem = () => {
        return focusedItemId;
    }
    const setFocusItem = (id: number | string | null) => {
        console.log("set to " + id)
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

    const [helpOpen, setHelpOpen] = useState(false);

    const canvasAPIRef = useRef<{
        zoomIn: () => void;
        zoomOut: () => void;
        resetView: () => void;
    } | null>(null);

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

    const arrowsRef = useRef(arrows);
    const itemsRef = useRef(items);


    // I don't like how this is done but this is the easiest way to do it
    useEffect(() => { arrowsRef.current = arrows; }, [arrows]);
    useEffect(() => { itemsRef.current = items; }, [items]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (currentInteractionModeRef.current !== "drawing-arrow") return;
            if (!arrowIdRef.current) return;
            
            const zoom = zoomRef.current;

            const worldX = e.clientX / zoom + curPosRef.current.x;
            const worldY = e.clientY / zoom + curPosRef.current.y;

            const arrows = arrowsRef.current;
            const items = itemsRef.current;

            const arrowIndex = arrows.findIndex(a => a.id === arrowIdRef.current);
            if (arrowIndex === -1) return;

            const updatedArrows = [...arrows];
            const snap = findSnapTarget(worldX, worldY, items);

            updatedArrows[arrowIndex] = {
                ...updatedArrows[arrowIndex],
                to: snap ?? { type: "free", x: worldX, y: worldY }
            };

            setArrows(updatedArrows);
            localStorage.setItem("arrows", JSON.stringify(updatedArrows));
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // onMouseUp has to be attached to window since it might not be started in the canvas
    // but it can end in the canvas, in that case, the interaction doesn't get detected here.
    // so attach it to window so it always gets detected.
    useEffect(() => {
        const handleMouseUp = () => {
            switch (currentInteractionModeRef.current) {
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
                const arrowToRemove = arrows.find(arrow => arrow.id === id);
                if (!arrowToRemove) return;
                removeArrow(arrowToRemove);
                setFocusItem(null);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedItemId, arrows]);

    const addInputCard = (worldX: number, worldY: number) => {
        setItems([...items, {
            x: worldX,
            y: worldY,
            w: 300,
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
        arrowIdRef.current = null;
    }


  return (
    <div className="canvas-container muted">
        <CanvasBackground 
            camera={curPosRef}
            zoomRef={zoomRef}
            interactionMode={currentInteractionModeRef}
            addCard={addInputCard}
            transformItems={transformItems}
            setFocusItem={setFocusItem}
            apiRef={canvasAPIRef}
            onZoomChange={setZoom}
        />

        <Toolbar
            zoom={zoom}
            onZoomIn={() => canvasAPIRef.current?.zoomIn()}
            onZoomOut={() => canvasAPIRef.current?.zoomOut()}
            onResetView={() => canvasAPIRef.current?.resetView()}
            onOpenHelp={() => setHelpOpen(true)}
        />

        <div ref={arrowsLayerRef} className="arrows-layer">
            <Arrows 
                items={items} 
                arrows={arrows} 
                moveArrow={moveArrow} 
                getFocusItem={getCurrentFocusItem}
                setFocusItem={setFocusItem}
                removeArrow={removeArrow}
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

        <HelpModal
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
        />
    </div>
  );
}
