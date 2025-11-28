"use client";

import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#1E4A7A] text-white hover:bg-[#183a60] focus-visible:ring-[#4A90E2] focus-visible:ring-offset-1",
  secondary: "bg-white text-[#1E4A7A] border border-[#D0D6DB] hover:bg-[#F5F7FA] focus-visible:ring-[#4A90E2] focus-visible:ring-offset-1",
  ghost: "bg-transparent text-[#1E4A7A] hover:bg-[#F5F7FA] focus-visible:ring-[#4A90E2] focus-visible:ring-offset-1"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-base px-5 py-2.5"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", asChild = false, className = "", children, ...props }, ref) => {
    const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className].filter(Boolean).join(" ");

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: [children.props.className, classes].filter(Boolean).join(" "),
        ...props
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
