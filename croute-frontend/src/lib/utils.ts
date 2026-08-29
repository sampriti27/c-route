import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Base tailwind-merge doesn't know about the "brand" palette added in
// tailwind.config.ts, so it can't tell `border-brand-*` is a border-color
// utility — it was falling into the same conflict group as the bare `border`
// (width) utility and silently dropping it. Registering the palette here
// fixes that for every color-based utility (bg/text/border/ring/etc).
const BRAND_COLORS = [
  "brand-bg",
  "brand-surface",
  "brand-surface2",
  "brand-border",
  "brand-green",
  "brand-green-dim",
  "brand-green-bd",
  "brand-blue",
  "brand-blue-dim",
  "brand-purple",
  "brand-purple-dim",
  "brand-amber",
  "brand-amber-dim",
  "brand-teal",
  "brand-teal-dim",
  "brand-red",
  "brand-text",
  "brand-muted",
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "text-color": [{ text: BRAND_COLORS }],
      "bg-color": [{ bg: BRAND_COLORS }],
      "border-color": [{ border: BRAND_COLORS }],
      "ring-color": [{ ring: BRAND_COLORS }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
