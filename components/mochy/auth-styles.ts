// Shared class strings for the (auth) route group in the Mochy style (docs/DESIGN.md §8):
// light or dark tokens, dark fields or white fields, pill button in the text color. The `m-*` classes
// live in app/globals.css under the "Mochy" section and only work inside a `.mochy` root.

export const AUTH_CARD_CLASS = "m-page w-full flex flex-col text-[var(--m-fg)]";

export const AUTH_TITLE_CLASS = "text-[34px] leading-[1.05] font-bold tracking-[-0.055em] text-[var(--m-fg)]";

export const AUTH_LEAD_CLASS = "mt-2.5 text-[15px] leading-relaxed font-medium tracking-[-0.012em] text-[var(--m-fg2)]";

export const AUTH_INPUT_CLASS = "m-field";

export const AUTH_LABEL_CLASS = "m-label";

export const AUTH_SUBMIT_CLASS = "m-btn m-btn-primary w-full mt-3";

export const AUTH_LINK_CLASS = "m-link";

export const AUTH_ERROR_CLASS = "text-[13px] font-medium text-[var(--m-err)]";

export const AUTH_FOOT_CLASS = "mt-7 text-center text-[13.5px] font-medium text-[var(--m-fg3)]";
