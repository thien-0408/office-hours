// Rendered inline (not an <img src="/LogoWithText.svg">) so the wordmark's
// `fill="currentColor"` can pick up the surrounding text color — the source
// asset at public/LogoWithText.svg hardcodes dark text, which is unreadable
// on the app's dark auth/nav surfaces. The mark/gradient stay fixed brand
// colors; only the text follows theme.
export function LogoWithText({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 540 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="OfficeHours"
    >
      <defs>
        <linearGradient id="logoWithText_blue_inline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="logoWithText_purple_inline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="logoWithText_teal_inline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* ===================================================== */}
      {/* Concept 4: Interlocking OH Loop Mark */}
      {/* ===================================================== */}
      <g transform="translate(10, 0)">
        {/* Left Ring: Advisor Loop ('O') */}
        <circle
          cx="46"
          cy="60"
          r="28"
          stroke="url(#logoWithText_blue_inline)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Right Ring: Student / Clock Loop ('H') */}
        <circle
          cx="74"
          cy="60"
          r="28"
          stroke="url(#logoWithText_purple_inline)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Intersecting Overlap / Synced Meeting Bridge */}
        <path
          d="M60 40 C65 46, 65 74, 60 80"
          stroke="url(#logoWithText_teal_inline)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Synchronized Active Node */}
        <circle cx="60" cy="60" r="6" fill="#10b981" />
        <circle cx="60" cy="60" r="10" stroke="#10b981" strokeWidth="2" opacity="0.5" />
      </g>

      {/* ===================================================== */}
      {/* Brand Typography */}
      {/* ===================================================== */}
      <text
        x="135"
        y="71"
        fontFamily="system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
        fontSize="44"
        fontWeight="700"
        letterSpacing="-1.2"
        fill="currentColor"
      >
        Office
        <tspan fontWeight="400" fillOpacity="0.75">
          Hours
        </tspan>
      </text>
    </svg>
  );
}
