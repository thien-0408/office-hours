import type { Notification } from "@/lib/office-hours/types";
import { NOTIFICATION_TYPE_CONFIG, notificationTone } from "@/lib/ui/notification-config";
import { relativeTime } from "@/lib/ui/relative-time";
import { IconChip } from "./IconChip";

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick?: () => void;
}) {
  const { icon } = NOTIFICATION_TYPE_CONFIG[notification.type];
  const tone = notificationTone(notification.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-5 py-4 text-left border-b border-[var(--paper-100)] last:border-0 transition-colors hover:bg-[var(--paper-50)] ${
        notification.read ? "" : "bg-[var(--brand-50)]"
      }`}
    >
      <IconChip icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[var(--ink-900)] truncate">{notification.title}</span>
          {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-500)] shrink-0" />}
        </span>
        <span className="block text-[13px] text-[var(--ink-600)] mt-0.5">{notification.body}</span>
        <span className="block text-[12px] text-[var(--ink-500)] tabular-nums mt-1">
          {relativeTime(notification.createdAt)}
        </span>
      </span>
    </button>
  );
}
