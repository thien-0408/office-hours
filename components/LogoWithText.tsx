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
        <linearGradient id="logoWithTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <filter id="logoWithTextGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g>
        <circle cx="30" cy="24" r="5.5" fill="#94a3b8" opacity="0.45" />
        <circle cx="30" cy="48" r="5.5" fill="#94a3b8" opacity="0.45" />
        <circle cx="30" cy="72" r="5.5" fill="#94a3b8" opacity="0.45" />
        <circle cx="30" cy="96" r="5.5" fill="#94a3b8" opacity="0.45" />

        <circle cx="62" cy="36" r="6" fill="#64748b" opacity="0.65" />
        <circle cx="62" cy="60" r="6" fill="#64748b" opacity="0.65" />
        <circle cx="62" cy="84" r="6" fill="#64748b" opacity="0.65" />

        <circle cx="94" cy="48" r="6.5" fill="#475569" opacity="0.85" />
        <circle cx="94" cy="72" r="6.5" fill="#475569" opacity="0.85" />

        <path
          d="M30 24 L132 60 M30 96 L132 60"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.4"
        />

        <circle cx="134" cy="60" r="14" fill="url(#logoWithTextGrad)" filter="url(#logoWithTextGlow)" />
      </g>

      <text
        x="175"
        y="71"
        fontFamily="system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
        fontSize="44"
        fontWeight="700"
        letterSpacing="-1.2"
        fill="currentColor"
      >
        Office
        <tspan fontWeight="400" fillOpacity="0.72">
          Hours
        </tspan>
      </text>
    </svg>
  );
}
