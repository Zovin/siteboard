"use client";

import { SquareIcon, MoveRight } from "lucide-react";

type StatusBarProps = {
  cardCount: number;
  arrowCount: number;
};

export function StatusBar({ cardCount, arrowCount }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        <SquareIcon size={13} />
        <span>{cardCount}</span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <MoveRight size={13} />
        <span>{arrowCount}</span>
      </div>
    </div>
  );
}
