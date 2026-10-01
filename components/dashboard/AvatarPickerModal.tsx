"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { MEMOJI_INDICES } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Same glassmorphism shell as ConfirmModal (docs/DESIGN.md reserves glass for
// "top nav, modals, dropdowns") — swaps the confirm/cancel body for a
// scrollable memoji grid.
export function AvatarPickerModal({
  open,
  currentIndex,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--brand-950)]/60 supports-backdrop-filter:backdrop-blur-md"
        className="block max-w-[420px] rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-7 shadow-2xl ring-0 backdrop-blur-2xl sm:max-w-[420px]"
      >
        <div className="mb-5 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-white">Choose your avatar</DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

        <div className="-mr-1 grid max-h-[320px] grid-cols-6 gap-2.5 overflow-y-auto pr-1">
          {MEMOJI_INDICES.map((index) => {
            const selected = index === currentIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelect(index)}
                aria-label={`Use memoji ${index}`}
                aria-pressed={selected}
                className={`relative overflow-hidden rounded-full transition-transform hover:scale-105 ${
                  selected ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/15"
                }`}
              >
                <Image src={`/memoji/${index}.png`} alt="" width={56} height={56}
                className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
