import type { WaitlistStatus } from "@/lib/office-hours/types";
import { HUE_TOKENS, WAITLIST_STATUS_CONFIG } from "@/lib/ui/status-hues";

export function WaitlistStatusBadge({ status }: { status: WaitlistStatus }) {
  const { label, hue } = WAITLIST_STATUS_CONFIG[status];
  const tokens = HUE_TOKENS[hue];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: tokens.bg, color: tokens.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.dot }} />
      {label}
    </span>
  );
}
