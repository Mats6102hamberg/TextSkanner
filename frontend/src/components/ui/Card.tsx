import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export function Card({ as: Component = "div", className = "", children, ...props }: CardProps) {
  const classes = ["bg-white rounded-2xl shadow-sm border border-[#E2E6EB] p-6", className].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const classes = ["mb-3 flex flex-col gap-1", className].filter(Boolean).join(" ");
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const classes = ["text-lg font-semibold text-[#111111]", className].filter(Boolean).join(" ");
  return (
    <h3 className={classes} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const classes = ["text-sm text-[#4B5563]", className].filter(Boolean).join(" ");
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const classes = ["mt-2", className].filter(Boolean).join(" ");
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
