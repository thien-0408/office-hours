import type { Metadata } from "next";
import WelcomeExperience from "@/components/WelcomeExperience";

export const metadata: Metadata = {
  title: "Welcome — OfficeHours",
  description: "Walk through a real lecture hall of conflict-free office-hour slots before you ever book one.",
};

export default function WelcomePage() {
  return <WelcomeExperience />;
}
