import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recherche par lot — mode technicien",
  description: "Vérifiez jusqu'à 50 références d'un coup : statut de fabrication et meilleur prix, exportables en CSV.",
};

export default function TechnicienLayout({ children }: { children: React.ReactNode }) {
  return children;
}
