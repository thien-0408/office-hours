import { Suspense } from "react";
import LecturersBrowser from "./LecturersBrowser";

export default function LecturersPage() {
  return (
    <Suspense fallback={null}>
      <LecturersBrowser />
    </Suspense>
  );
}
