import * as React from "react";
import { cn } from "@/lib/utils";
import "@/components/ui/pixelact-ui/styles/styles.css";

const inputStyles = `
  .pixel-input-regular-placeholder::placeholder {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px;
  }
`;

export interface PixelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, PixelInputProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: inputStyles }} />
        <input
          className={cn(
            "pixel__input pixel-font max-w-full outline-none p-2 bg-background text-foreground pixel-input-regular-placeholder disabled:opacity-40",
            disabled && "disabled:opacity-40 disabled:cursor-not-allowed",
            className
          )}
          style={{
            boxShadow: '-4px 0px 0px 0px rgb(0, 0, 0), 4px 0px 0px 0px rgb(0, 0, 0), 0px 4px 0px 0px rgb(0, 0, 0), 0px -4px 0px 0px rgb(0, 0, 0), -4px 0px 0px 0px rgb(200, 200, 200) inset, 0px -4px 0px 0px rgb(200, 200, 200) inset',
            margin: '4px',
            ...props.style
          }}
          disabled={disabled}
          ref={ref}
          {...props}
        />
      </>
    );
  }
);
Input.displayName = "PixelInput";

export { Input };
