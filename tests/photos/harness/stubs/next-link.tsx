import type { ComponentProps } from "react";

export default function Link({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string | object }) {
  return <a href={typeof href === "string" ? href : "#"} {...props} />;
}
