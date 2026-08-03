import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create account — OfficeHours",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
