"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Option = { value: string; label: React.ReactNode; disabled?: boolean }

// Flattens <option> children (including mapped arrays and fragments) into data, so
// call sites can keep writing plain <option>s while the popup is the styled Base UI
// Select instead of the browser's native list.
function collectOptions(children: React.ReactNode): Option[] {
  const out: Option[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean }
    if (child.type === "option") {
      out.push({
        value: String(props.value ?? props.children ?? ""),
        label: props.children,
        disabled: props.disabled,
      })
    } else if (props.children) {
      out.push(...collectOptions(props.children))
    }
  })
  return out
}

type SelectFieldProps = {
  value: string | number
  /** Same shape as a native select's change event, so `(e) => set(e.target.value)` keeps working. */
  onChange?: (event: { target: { value: string } }) => void
  onValueChange?: (value: string) => void
  children: React.ReactNode
  size?: "sm" | "default"
  className?: string
  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  "aria-label"?: string
}

function SelectField({
  value,
  onChange,
  onValueChange,
  children,
  size = "default",
  className,
  id,
  name,
  disabled,
  required,
  placeholder,
  "aria-label": ariaLabel,
}: SelectFieldProps) {
  const options = collectOptions(children)

  return (
    <Select
      value={String(value)}
      items={options.map(({ value: v, label }) => ({ value: v, label }))}
      name={name}
      disabled={disabled}
      required={required}
      onValueChange={(next) => {
        if (next == null) return
        onValueChange?.(next as string)
        onChange?.({ target: { value: next as string } })
      }}
    >
      <SelectTrigger id={id} size={size} aria-label={ariaLabel} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { SelectField }
