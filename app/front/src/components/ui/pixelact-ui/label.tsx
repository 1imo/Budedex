import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

import "@/components/ui/pixelact-ui/styles/styles.css";

interface PixelLabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root> {
  asChild?: boolean;
}

function Label({ className, ...props }: PixelLabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn("pixel-font text-foreground mb-2", className)}
      {...props}
    />
  );
}

export { Label };
