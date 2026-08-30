import * as React from "react"
import { Slider as DocrPrimitive } from "@base-ui/react/slider"

import { cn } from "~/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof DocrPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <DocrPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      className={cn(
        "group/slider relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <DocrPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full grow items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col"
      >
        <DocrPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-[3px] data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[3px]"
          )}
        >
          <DocrPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "absolute bg-foreground data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
            )}
          />
        </DocrPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <DocrPrimitive.Thumb
            data-slot="slider-thumb"
            index={index}
            key={index}
            className="block size-3.5 shrink-0 rounded-full border border-foreground bg-card shadow-edge transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </DocrPrimitive.Control>
    </DocrPrimitive.Root>
  )
}

export { Slider }
