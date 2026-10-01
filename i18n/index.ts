import { en, type MessageKey } from "./messages/en";
import { vi } from "./messages/vi";
import { resolveLocale, type Locale } from "./config";

export { LOCALE_COOKIE, LOCALE_META, SUPPORTED_LOCALES, resolveLocale } from "./config";
export type { Locale } from "./config";
export type { MessageKey } from "./messages/en";

export const messages: Record<Locale, Record<MessageKey, string>> = { en, vi };

export function translate(locale: Locale, key: MessageKey, values?: Record<string, string | number>): string {
  const template = messages[locale][key] ?? messages.en[key] ?? key;
  if (!values) return template;
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function getMessages(localeValue?: string | null) {
  const locale = resolveLocale(localeValue);
  return { locale, messages: messages[locale] };
}

