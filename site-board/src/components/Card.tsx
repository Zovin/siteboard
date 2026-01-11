import type { Item } from "../types/item";

type Props = {
    card: Item;
    onUpdate: (card: Item) => void;
}

export function Card({ card, onUpdate }: Props) {

    function withHttps(url: string) {
        if (!/^https?:\/\//i.test(url)) {
            return "https://" + url;
        }
        return url;
    }

    // initial 
    if (card.type == "input") {
        return (
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
                    width: card.w,
                    height: card.h,
                    left: card.x,
                    top: card.y,
                    // background: "red",
                    position: "absolute",
                }}
            />
        )
    }

    console.log(card.value);

    return (
        <iframe
            src={withHttps(card.value)}
            style={{
                position: "absolute",
                left: card.x,
                top: card.y,
                width: "500",
                height: "500",
                border: "none",
                zIndex: card.z,
            }}
        />
    )
}