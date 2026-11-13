"use client";

// Mechanical-counter digits (STYLE-MOCHY §2.4): each digit is a 0–9 reel that rolls
// vertically with a little overshoot, faded at the top and bottom edge. Non-digit
// characters (":" etc.) render as-is. Screen readers get the plain value.
export function Odometer({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`m-odo ${className ?? ""}`}>
      <span className="sr-only">{value}</span>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="m-odo-d" aria-hidden="true">
            <span className="m-odo-reel" style={{ transform: `translateY(${-Number(ch)}em)` }}>
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true" className="m-odo-sep">
            {ch}
          </span>
        )
      )}
    </span>
  );
}
