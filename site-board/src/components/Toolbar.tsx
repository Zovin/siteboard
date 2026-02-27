import { ZoomIn, ZoomOut, RotateCcw, HelpCircle  } from "lucide-react"

interface ZoomToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onOpenHelp: () => void
}

export default function Toolbar({
    zoom,
    onZoomIn,
    onZoomOut,
    onResetView,
    onOpenHelp
}: ZoomToolbarProps) {
    return (
        <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 p-1.5 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg">
        
        <ToolButton
            icon={ZoomOut}
            label="Zoom Out"
            onClick={onZoomOut}
        />

        <span className="px-2 text-xs font-medium text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
        </span>

        <ToolButton
            icon={ZoomIn}
            label="Zoom In"
            onClick={onZoomIn}
        />

        <ToolButton
            icon={RotateCcw}
            label="Reset View"
            onClick={onResetView}
        />

        <ToolButton
            icon={HelpCircle}
            label="Help"
            onClick={onOpenHelp}
        />
        </div>
    )
}

interface ToolButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}

function ToolButton({ icon: Icon, label, onClick }: ToolButtonProps) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="p-2 rounded-lg transition-colors duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
            <Icon className="w-4 h-4" />
        </button>
    )
}