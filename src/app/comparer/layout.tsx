import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparaison de pièces",
  robots: { index: false },
};

export default function ComparerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
