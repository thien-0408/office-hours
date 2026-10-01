import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Thin wrappers over components/ui — kept so existing call sites don't change.
export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex flex-col items-stretch gap-1.5">
      <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">{label}</span>
      {children}
    </Label>
  );
}

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} />;
}
