"use client";

import type { WaitlistStatus } from "@/lib/office-hours/types";
import { HUE_TOKENS, WAITLIST_STATUS_CONFIG } from "@/lib/ui/status-hues";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/provider";

export function WaitlistStatusBadge({ status, labelOverride }: { status: WaitlistStatus; labelOverride?: string }) {
  const { label, hue } = WAITLIST_STATUS_CONFIG[status];
  const { t } = useI18n();
  const key = `waitlist.status.${status.toLowerCase()}` as Parameters<typeof t>[0];

  return (
    <Badge variant={hue}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: HUE_TOKENS[hue].dot }} />
      {labelOverride ?? t(key) ?? label}
    </Badge>
  );
}
