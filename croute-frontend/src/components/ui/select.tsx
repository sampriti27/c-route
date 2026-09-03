import type { ReactNode } from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Select(props: SelectPrimitive.Root.Props<string>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border border-[#1b2844] bg-[#0c1322] px-4 py-3 text-sm text-white transition-all outline-none cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 data-[popup-open]:border-emerald-500 data-[popup-open]:ring-1 data-[popup-open]:ring-emerald-500",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-slate-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectPopup({
  className,
  children,
  sideOffset = 6,
  ...props
}: SelectPrimitive.Positioner.Props & {
  className?: string
  children: ReactNode
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side="bottom"
        align="start"
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
        collisionAvoidance={{ side: "none" }}
        className="z-50"
        {...props}
      >
        <SelectPrimitive.Popup
          className={cn(
            "max-h-[min(var(--available-height),20rem)] w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-[#1b2844] bg-[#0c1322] p-1.5 shadow-2xl shadow-black/40 outline-none",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[ending-style]:-translate-y-1 transition-[opacity,transform] duration-100",
            className
          )}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none select-none data-[highlighted]:bg-emerald-500/10 data-[highlighted]:text-emerald-400",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5 text-emerald-400" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem }
