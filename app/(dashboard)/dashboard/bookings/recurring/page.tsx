import { Suspense } from "react";
import RecurringBookingClient from "./RecurringBookingClient";

export default function RecurringBookingPage() {
  return (
    <Suspense fallback={null}>
      <RecurringBookingClient />
    </Suspense>
  );
}
