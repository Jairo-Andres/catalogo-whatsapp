import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "wa" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonClass(variant: ButtonVariant = "primary", size: Size = "md", className?: string) {
  return cn("ja-btn", `ja-btn--${variant}`, size === "lg" && "ja-btn--lg", size === "sm" && "ja-btn--sm", className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
