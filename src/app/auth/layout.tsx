import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Forge",
  description: "Sign in to your Forge transformation dashboard.",
};

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return children;
}
