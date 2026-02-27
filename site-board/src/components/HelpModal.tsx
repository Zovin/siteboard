import { useEffect, useCallback, useRef } from "react"
import { X, Move, ZoomIn, MousePointerClick, Info } from "lucide-react"

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const instructions = [
  {
    icon: Move,
    text: "Drag anywhere on the canvas to move around",
  },
  {
    icon: ZoomIn,
    text: "Scroll up or down to zoom in and out",
  },
  {
    icon: MousePointerClick,
    text: "Double click anywhere on the canvas to create a new card, then enter the website link.",
  },
]

const exampleSites = ["wikipedia.com", "developer.mozilla.org", "example.com"]

export function HelpModal({ open, onClose }: HelpModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className="relative w-full max-w-[530px] mx-4 rounded-2xl border border-white/[0.08] bg-[#1a1a1f] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label="Close help modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <h2
          id="help-modal-title"
          className="text-xl font-semibold tracking-tight text-white/95"
        >
          How to Use Site-Board
        </h2>

        {/* Instructions */}
        <div className="mt-7 flex flex-col gap-5">
          {instructions.map((item) => (
            <div key={item.text} className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                <item.icon className="h-[18px] w-[18px] text-white/50" />
              </div>
              <p className="text-[15px] leading-relaxed text-white/60">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="mt-7 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
            <div>
              <p className="text-sm leading-relaxed text-white/45">
                <span className="font-medium text-white/55">Note:</span>{" "}
                Some websites do not allow embedding inside iframes due to
                security restrictions. If a site does not load, try opening it in
                a new tab instead.
              </p>
              <p className="mt-3 text-sm text-white/40">
                Example sites that usually work well:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {exampleSites.map((site) => (
                  <span
                    key={site}
                    className="inline-flex rounded-md bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white/50 border border-white/[0.06]"
                  >
                    {site}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}