"use client";

import { ShieldAlert, type LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Glassmorphism confirm dialog — dark blurred backdrop + frosted card, reusing
// the same --glass-* tokens the auth pages use (docs/DESIGN.md §1), not new
// values. Built on the shadcn AlertDialog (Base UI) so focus trap, Esc,
// scroll-lock and aria come from the primitive instead of being hand-rolled.
// Generic (icon/title/copy/labels are props) so any destructive/confirm action
// (cancel booking, decline, etc.) can reuse it.
export function ConfirmModal({
  open,
  icon: Icon = ShieldAlert,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  icon?: LucideIcon;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent
        overlayClassName="bg-[var(--brand-950)]/60 supports-backdrop-filter:backdrop-blur-md"
        className="block max-w-[340px] rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-7 py-8 text-center shadow-2xl ring-0 backdrop-blur-2xl data-[size=default]:max-w-[340px] data-[size=default]:sm:max-w-[340px]"
      >
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <Icon className="h-6 w-6 text-[var(--brand-900)]" strokeWidth={2} />
        </span>
        <AlertDialogTitle className="mb-2 text-lg font-bold text-white">{title}</AlertDialogTitle>
        <AlertDialogDescription className="mb-7 text-[13.5px] leading-relaxed text-white/70">
          {description}
        </AlertDialogDescription>
        <div className="flex flex-col gap-2.5">
          <Button size="lg" className="w-full bg-white font-bold text-[var(--ink-900)] hover:bg-white/90" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button size="lg" variant="glass" className="w-full font-bold" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
