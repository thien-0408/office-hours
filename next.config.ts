import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 restricts optimized quality to [75] unless allowlisted — the
    // auth background is a smooth gradient photo where q75 WebP re-encoding
    // introduces visible banding, so 95 is allowed for that case.
    qualities: [75, 95],
  },
};

export default nextConfig;
