import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ma liste",
  robots: { index: false },
};

export default function ListeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
