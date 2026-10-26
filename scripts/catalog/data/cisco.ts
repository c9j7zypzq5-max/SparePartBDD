import { family, type Row } from "../lib";

const base = { manufacturer: "Cisco", industry: "informatique" } as const;

/** Module optique : [référence, description courte, attributs, remplacement éventuel]. */
function optics(rows: [string, string, Record<string, string>, string?][]): Row[] {
  return rows.map(([ref, name, attributes, by]) => [ref, name, attributes, by ? { by } : undefined]);
}

export const cisco = [
  // ── Catalyst 9200 / 9300 / 9500 / 1000 ─────────────────────────────────────
  ...family(
    { ...base, category: "Commutateurs réseau", status: "active", confidence: 75,
      describe: (name) => `${name}. Commutateur d'accès Catalyst 9200, empilable, licence Network Essentials.` },
    [
      ["C9200-24T-4G-E", "Catalyst 9200 24 ports GbE, 4 x 1G SFP", { "Ports": "24 x 1G RJ45", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9200-48T-4G-E", "Catalyst 9200 48 ports GbE, 4 x 1G SFP", { "Ports": "48 x 1G RJ45", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9200-24P-4G-E", "Catalyst 9200 24 ports GbE PoE+, 4 x 1G SFP", { "Ports": "24 x 1G PoE+", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9200-48P-4G-E", "Catalyst 9200 48 ports GbE PoE+, 4 x 1G SFP", { "Ports": "48 x 1G PoE+", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9200L-24P-4G-E", "Catalyst 9200L 24 ports GbE PoE+, 4 x 1G SFP fixes", { "Ports": "24 x 1G PoE+", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9200L-48P-4G-E", "Catalyst 9200L 48 ports GbE PoE+, 4 x 1G SFP fixes", { "Ports": "48 x 1G PoE+", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9200L-24T-4X-E", "Catalyst 9200L 24 ports GbE, 4 x 10G SFP+ fixes", { "Ports": "24 x 1G RJ45", "Liaisons montantes": "4 x 10G SFP+" }],
      ["C9200L-48T-4X-E", "Catalyst 9200L 48 ports GbE, 4 x 10G SFP+ fixes", { "Ports": "48 x 1G RJ45", "Liaisons montantes": "4 x 10G SFP+" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "active", confidence: 75,
      describe: (name) => `${name}. Commutateur Catalyst 9300 empilable (StackWise-480), module de liaisons montantes modulaire.` },
    [
      ["C9300-24U-E", "Catalyst 9300 24 ports GbE UPOE, Network Essentials", { "Ports": "24 x 1G UPOE" }],
      ["C9300-48U-E", "Catalyst 9300 48 ports GbE UPOE, Network Essentials", { "Ports": "48 x 1G UPOE" }],
      ["C9300-24UX-E", "Catalyst 9300 24 ports mGig UPOE, Network Essentials", { "Ports": "24 x 100M/1/2,5/5/10G UPOE" }],
      ["C9300-24T-A", "Catalyst 9300 24 ports GbE, Network Advantage", { "Ports": "24 x 1G RJ45" }],
      ["C9300-48P-A", "Catalyst 9300 48 ports GbE PoE+, Network Advantage", { "Ports": "48 x 1G PoE+" }],
      ["C9300L-24T-4G-E", "Catalyst 9300L 24 ports GbE, 4 x 1G SFP fixes", { "Ports": "24 x 1G RJ45", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9300L-48T-4G-E", "Catalyst 9300L 48 ports GbE, 4 x 1G SFP fixes", { "Ports": "48 x 1G RJ45", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9300L-24P-4G-E", "Catalyst 9300L 24 ports GbE PoE+, 4 x 1G SFP fixes", { "Ports": "24 x 1G PoE+", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9300L-48P-4G-E", "Catalyst 9300L 48 ports GbE PoE+, 4 x 1G SFP fixes", { "Ports": "48 x 1G PoE+", "Liaisons montantes": "4 x 1G SFP" }],
      ["C9500-24Y4C-E", "Catalyst 9500 24 ports 25G SFP28, 4 x 100G QSFP28", { "Ports": "24 x 25G SFP28 + 4 x 100G QSFP28" }],
      ["C9500-48Y4C-E", "Catalyst 9500 48 ports 25G SFP28, 4 x 100G QSFP28", { "Ports": "48 x 25G SFP28 + 4 x 100G QSFP28" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "active", confidence: 70,
      describe: (name) => `${name}. Commutateur administrable Catalyst 1000 pour petits sites.` },
    [
      ["C1000-8T-2G-L", "Catalyst 1000 8 ports GbE, 2 x 1G SFP/RJ45", { "Ports": "8 x 1G RJ45" }],
      ["C1000-24T-4G-L", "Catalyst 1000 24 ports GbE, 4 x 1G SFP", { "Ports": "24 x 1G RJ45" }],
      ["C1000-48T-4G-L", "Catalyst 1000 48 ports GbE, 4 x 1G SFP", { "Ports": "48 x 1G RJ45" }],
      ["C1000-24P-4G-L", "Catalyst 1000 24 ports GbE PoE+, 4 x 1G SFP", { "Ports": "24 x 1G PoE+" }],
    ],
  ),
  // ── Catalyst 2960-X / 3650 / 3850 / 3750-X / 3560-X (arrêtés) ──────────────
  ...family(
    { ...base, category: "Commutateurs réseau", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Fin de vente Catalyst 2960-X : Cisco oriente vers le Catalyst 9200L équivalent.` },
    [
      ["WS-C2960X-24PS-L", "Catalyst 2960-X 24 ports GbE PoE+, 4 x 1G SFP, LAN Base", { "Ports": "24 x 1G PoE+" }, { by: "C9200L-24P-4G-E" }],
      ["WS-C2960X-48FPS-L", "Catalyst 2960-X 48 ports GbE PoE+ 740 W, 4 x 1G SFP, LAN Base", { "Ports": "48 x 1G PoE+" }, { by: "C9200L-48P-4G-E" }],
      ["WS-C2960X-48LPS-L", "Catalyst 2960-X 48 ports GbE PoE+ 370 W, 4 x 1G SFP, LAN Base", { "Ports": "48 x 1G PoE+" }, { by: "C9200L-48P-4G-E" }],
      ["WS-C2960X-24TD-L", "Catalyst 2960-X 24 ports GbE, 2 x 10G SFP+, LAN Base", { "Ports": "24 x 1G RJ45" }, { by: "C9200L-24T-4X-E" }],
      ["WS-C2960X-48TD-L", "Catalyst 2960-X 48 ports GbE, 2 x 10G SFP+, LAN Base", { "Ports": "48 x 1G RJ45" }, { by: "C9200L-48T-4X-E" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Fin de vente Catalyst 3650 : migration vers le Catalyst 9300L équivalent.` },
    [
      ["WS-C3650-24TS-S", "Catalyst 3650 24 ports GbE, 4 x 1G SFP, IP Base", { "Ports": "24 x 1G RJ45" }, { by: "C9300L-24T-4G-E" }],
      ["WS-C3650-48TS-S", "Catalyst 3650 48 ports GbE, 4 x 1G SFP, IP Base", { "Ports": "48 x 1G RJ45" }, { by: "C9300L-48T-4G-E" }],
      ["WS-C3650-24PS-S", "Catalyst 3650 24 ports GbE PoE+, 4 x 1G SFP, IP Base", { "Ports": "24 x 1G PoE+" }, { by: "C9300L-24P-4G-E" }],
      ["WS-C3650-48PS-S", "Catalyst 3650 48 ports GbE PoE+, 4 x 1G SFP, IP Base", { "Ports": "48 x 1G PoE+" }, { by: "C9300L-48P-4G-E" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Fin de vente Catalyst 3850 : migration vers le Catalyst 9300 équivalent.` },
    [
      ["WS-C3850-48P-S", "Catalyst 3850 48 ports GbE PoE+, IP Base", { "Ports": "48 x 1G PoE+" }, { by: "C9300-48P-E" }],
      ["WS-C3850-24U-S", "Catalyst 3850 24 ports GbE UPOE, IP Base", { "Ports": "24 x 1G UPOE" }, { by: "C9300-24U-E" }],
      ["WS-C3850-48U-S", "Catalyst 3850 48 ports GbE UPOE, IP Base", { "Ports": "48 x 1G UPOE" }, { by: "C9300-48U-E" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Catalyst 3750-X arrêté de longue date : migration vers le Catalyst 9300.` },
    [
      ["WS-C3750X-24P-S", "Catalyst 3750-X 24 ports GbE PoE+, IP Base", { "Ports": "24 x 1G PoE+" }, { by: "C9300-24P-E" }],
      ["WS-C3750X-48P-S", "Catalyst 3750-X 48 ports GbE PoE+, IP Base", { "Ports": "48 x 1G PoE+" }, { by: "C9300-48P-E" }],
      ["WS-C3560X-24T-S", "Catalyst 3560-X 24 ports GbE, IP Base", { "Ports": "24 x 1G RJ45" }],
      ["WS-C3560X-48T-S", "Catalyst 3560-X 48 ports GbE, IP Base", { "Ports": "48 x 1G RJ45" }],
      ["WS-C3560X-24P-S", "Catalyst 3560-X 24 ports GbE PoE+, IP Base", { "Ports": "24 x 1G PoE+" }],
      ["WS-C3560X-48P-S", "Catalyst 3560-X 48 ports GbE PoE+, IP Base", { "Ports": "48 x 1G PoE+" }],
    ],
  ),

  // ── Routeurs ───────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "active", confidence: 70,
      describe: (name) => `${name}. Plate-forme de périphérie Catalyst 8000 (SD-WAN, routage), modules NIM.` },
    [
      ["C8200-1N-4T", "Routeur Catalyst 8200, 1 emplacement NIM, 4 ports GbE", { "Ports": "4 x 1G", "Emplacements": "1 NIM" }],
      ["C8200L-1N-4T", "Routeur Catalyst 8200L, 1 emplacement NIM, 4 ports GbE", { "Ports": "4 x 1G", "Emplacements": "1 NIM" }],
      ["C8300-1N1S-4T2X", "Routeur Catalyst 8300, 1 NIM + 1 SM, 4 x 1G + 2 x 10G", { "Ports": "4 x 1G + 2 x 10G" }],
      ["C8300-1N1S-6T", "Routeur Catalyst 8300, 1 NIM + 1 SM, 6 x 1G", { "Ports": "6 x 1G" }],
      ["C8300-2N2S-4T2X", "Routeur Catalyst 8300, 2 NIM + 2 SM, 4 x 1G + 2 x 10G", { "Ports": "4 x 1G + 2 x 10G" }],
      ["C8300-2N2S-6T", "Routeur Catalyst 8300, 2 NIM + 2 SM, 6 x 1G", { "Ports": "6 x 1G" }],
      ["C1111-4P", "Routeur ISR 1100 4 ports GbE, double WAN GbE", { "Ports": "4 x 1G LAN" }],
      ["C1111-8P", "Routeur ISR 1100 8 ports GbE, double WAN GbE", { "Ports": "8 x 1G LAN" }],
      ["C1121-8P", "Routeur ISR 1100 8 ports GbE, WAN GbE", { "Ports": "8 x 1G LAN" }],
      ["C1161-8P", "Routeur ISR 1100 8 ports GbE, WAN GbE/SFP", { "Ports": "8 x 1G LAN" }],
    ],
  ),
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Routeur ISR G2 arrêté (fin de support) : migration vers la gamme ISR 4000.` },
    [
      ["CISCO1921/K9", "Routeur ISR G2 Cisco 1921", null],
      ["CISCO1941/K9", "Routeur ISR G2 Cisco 1941", null, { by: "ISR4321/K9" }],
      ["CISCO2921/K9", "Routeur ISR G2 Cisco 2921", null, { by: "ISR4331/K9" }],
      ["CISCO2951/K9", "Routeur ISR G2 Cisco 2951", null, { by: "ISR4351/K9" }],
      ["CISCO3925/K9", "Routeur ISR G2 Cisco 3925", null],
      ["CISCO3945/K9", "Routeur ISR G2 Cisco 3945", null],
    ],
  ),

  // ── Pare-feux ──────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "active", confidence: 65,
      describe: (name) => `${name}. Pare-feu de nouvelle génération Secure Firewall (Firepower) 1000, logiciel Threat Defense.` },
    [
      ["FPR1010-NGFW-K9", "Pare-feu Firepower 1010, 8 ports GbE", { "Ports": "8 x 1G" }],
      ["FPR1120-NGFW-K9", "Pare-feu Firepower 1120, 8 ports GbE + 4 SFP", { "Ports": "8 x 1G + 4 x 1G SFP" }],
      ["FPR1140-NGFW-K9", "Pare-feu Firepower 1140, 8 ports GbE + 4 SFP", { "Ports": "8 x 1G + 4 x 1G SFP" }],
      ["FPR1150-NGFW-K9", "Pare-feu Firepower 1150, 8 ports GbE + 2 x 10G SFP+", { "Ports": "8 x 1G + 2 x 10G SFP+" }],
    ],
  ),
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "unknown", confidence: 65,
      describe: (name) => `${name}. Pare-feu Firepower 2100 de nouvelle génération.` },
    [
      ["FPR2110-NGFW-K9", "Pare-feu Firepower 2110, 12 ports GbE + 4 SFP", null],
      ["FPR2120-NGFW-K9", "Pare-feu Firepower 2120, 12 ports GbE + 4 SFP", null],
      ["FPR2130-NGFW-K9", "Pare-feu Firepower 2130, 12 ports GbE + 4 x 10G SFP+", null],
      ["FPR2140-NGFW-K9", "Pare-feu Firepower 2140, 12 ports GbE + 4 x 10G SFP+", null],
    ],
  ),
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Pare-feu ASA 5500-X arrêté : Cisco oriente vers la gamme Firepower 1000.` },
    [
      ["ASA5506-K9", "Pare-feu ASA 5506-X avec services FirePOWER", null, { by: "FPR1010-NGFW-K9", oem: ["ASA5506-X"] }],
      ["ASA5508-K9", "Pare-feu ASA 5508-X avec services FirePOWER", null, { by: "FPR1120-NGFW-K9", oem: ["ASA5508-X"] }],
      ["ASA5516-FPWR-K9", "Pare-feu ASA 5516-X avec services FirePOWER", null, { by: "FPR1140-NGFW-K9", oem: ["ASA5516-X"] }],
      ["ASA5525-K9", "Pare-feu ASA 5525-X", null, { oem: ["ASA5525-X"] }],
      ["ASA5545-K9", "Pare-feu ASA 5545-X", null, { oem: ["ASA5545-X"] }],
      ["ASA5555-K9", "Pare-feu ASA 5555-X", null, { oem: ["ASA5555-X"] }],
    ],
  ),

  // ── Wi-Fi : Aironet / Catalyst / Meraki ────────────────────────────────────
  ...family(
    { ...base, category: "Points d'accès Wi-Fi", status: "unknown", confidence: 65,
      describe: (name) => `${name}, point d'accès Wi-Fi 6 Catalyst 9100 pour intérieur.` },
    [
      ["C9105AXI-E", "Point d'accès Catalyst 9105AXI Wi-Fi 6, antennes internes", { "Norme": "802.11ax" }],
      ["C9115AXI-E", "Point d'accès Catalyst 9115AXI Wi-Fi 6, antennes internes", { "Norme": "802.11ax" }],
      ["C9120AXI-E", "Point d'accès Catalyst 9120AXI Wi-Fi 6, antennes internes", { "Norme": "802.11ax" }],
      ["C9130AXI-E", "Point d'accès Catalyst 9130AXI Wi-Fi 6, antennes internes", { "Norme": "802.11ax" }],
    ],
  ),
  ...family(
    { ...base, category: "Points d'accès Wi-Fi", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Point d'accès Aironet arrêté : remplacement par la gamme Catalyst 9100 Wi-Fi 6.` },
    [
      ["AIR-AP1832I-E-K9", "Point d'accès Aironet 1832i Wi-Fi 5", { "Norme": "802.11ac Wave 2" }, { by: "C9115AXI-E" }],
      ["AIR-AP2802I-E-K9", "Point d'accès Aironet 2802i Wi-Fi 5", { "Norme": "802.11ac Wave 2" }, { by: "C9120AXI-E" }],
      ["AIR-AP3802I-E-K9", "Point d'accès Aironet 3802i Wi-Fi 5", { "Norme": "802.11ac Wave 2" }, { by: "C9130AXI-E" }],
      ["AIR-CAP2702I-E-K9", "Point d'accès Aironet 2702i Wi-Fi 5", { "Norme": "802.11ac" }],
    ],
  ),
  ...family(
    { ...base, category: "Points d'accès Wi-Fi", status: "active", confidence: 60,
      describe: (name) => `${name}, point d'accès Cisco Meraki administré dans le cloud.` },
    [
      ["MR36-HW", "Point d'accès Meraki MR36 Wi-Fi 6", { "Norme": "802.11ax" }],
      ["MR44-HW", "Point d'accès Meraki MR44 Wi-Fi 6", { "Norme": "802.11ax" }],
      ["MR46-HW", "Point d'accès Meraki MR46 Wi-Fi 6", { "Norme": "802.11ax" }],
      ["MR56-HW", "Point d'accès Meraki MR56 Wi-Fi 6", { "Norme": "802.11ax" }],
    ],
  ),
  ...family(
    { ...base, category: "Points d'accès Wi-Fi", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Fin de vente Meraki, remplacé par son successeur Wi-Fi 6.` },
    [
      ["MR33-HW", "Point d'accès Meraki MR33 Wi-Fi 5", { "Norme": "802.11ac Wave 2" }, { by: "MR36-HW" }],
      ["MR42-HW", "Point d'accès Meraki MR42 Wi-Fi 5", { "Norme": "802.11ac Wave 2" }, { by: "MR46-HW" }],
      ["MR52-HW", "Point d'accès Meraki MR52 Wi-Fi 5", { "Norme": "802.11ac Wave 2" }, { by: "MR56-HW" }],
    ],
  ),
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "active", confidence: 60,
      describe: (name) => `${name}, appliance de sécurité et SD-WAN Cisco Meraki MX administrée dans le cloud.` },
    [
      ["MX67-HW", "Appliance de sécurité Meraki MX67", null],
      ["MX68-HW", "Appliance de sécurité Meraki MX68, PoE+", null],
      ["MX85-HW", "Appliance de sécurité Meraki MX85", null],
      ["MX95-HW", "Appliance de sécurité Meraki MX95", null],
    ],
  ),
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Fin de vente Meraki, remplacé par son successeur dans la gamme MX.` },
    [
      ["MX64-HW", "Appliance de sécurité Meraki MX64", null, { by: "MX67-HW" }],
      ["MX84-HW", "Appliance de sécurité Meraki MX84", null, { by: "MX85-HW" }],
      ["MX100-HW", "Appliance de sécurité Meraki MX100", null],
    ],
  ),

  // ── Modules optiques ───────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules optiques SFP", status: "active", confidence: 75,
      describe: (name) => `${name}, module enfichable Cisco à chaud.` },
    optics([
      ["GLC-TE", "Module SFP 1000BASE-T cuivre RJ45, température étendue", { "Débit": "1 Gbit/s", "Média": "cuivre RJ45, 100 m" }],
      ["GLC-ZX-SMD", "Module SFP 1000BASE-ZX monomode 1550 nm, DOM", { "Débit": "1 Gbit/s", "Portée": "70 km" }],
      ["GLC-EX-SMD", "Module SFP 1000BASE-EX monomode 1310 nm, DOM", { "Débit": "1 Gbit/s", "Portée": "40 km" }],
      ["GLC-BX-D", "Module SFP 1000BASE-BX10 bidirectionnel aval (1490/1310 nm)", { "Débit": "1 Gbit/s", "Portée": "10 km" }],
      ["GLC-BX-U", "Module SFP 1000BASE-BX10 bidirectionnel amont (1310/1490 nm)", { "Débit": "1 Gbit/s", "Portée": "10 km" }],
      ["SFP-10G-SR-S", "Module SFP+ 10GBASE-SR multimode 850 nm, classe S", { "Débit": "10 Gbit/s", "Portée": "300 m OM3" }],
      ["SFP-10G-LR-S", "Module SFP+ 10GBASE-LR monomode 1310 nm, classe S", { "Débit": "10 Gbit/s", "Portée": "10 km" }],
      ["SFP-10G-ER", "Module SFP+ 10GBASE-ER monomode 1550 nm", { "Débit": "10 Gbit/s", "Portée": "40 km" }],
      ["SFP-10G-ZR", "Module SFP+ 10GBASE-ZR monomode 1550 nm", { "Débit": "10 Gbit/s", "Portée": "80 km" }],
      ["SFP-H10GB-CU1M", "Câble twinax SFP+ 10GBASE-CU passif 1 m", { "Débit": "10 Gbit/s", "Longueur": "1 m" }],
      ["SFP-H10GB-CU3M", "Câble twinax SFP+ 10GBASE-CU passif 3 m", { "Débit": "10 Gbit/s", "Longueur": "3 m" }],
      ["SFP-H10GB-CU5M", "Câble twinax SFP+ 10GBASE-CU passif 5 m", { "Débit": "10 Gbit/s", "Longueur": "5 m" }],
      ["QSFP-40G-LR4", "Module QSFP+ 40GBASE-LR4 monomode", { "Débit": "40 Gbit/s", "Portée": "10 km" }],
      ["QSFP-40G-SR-BD", "Module QSFP+ 40GBASE-SR bidirectionnel multimode (duplex LC)", { "Débit": "40 Gbit/s", "Portée": "100 m OM3" }],
      ["QSFP-H40G-CU1M", "Câble twinax QSFP+ 40GBASE-CR4 passif 1 m", { "Débit": "40 Gbit/s", "Longueur": "1 m" }],
      ["QSFP-H40G-CU3M", "Câble twinax QSFP+ 40GBASE-CR4 passif 3 m", { "Débit": "40 Gbit/s", "Longueur": "3 m" }],
      ["QSFP-100G-LR4-S", "Module QSFP28 100GBASE-LR4 monomode, classe S", { "Débit": "100 Gbit/s", "Portée": "10 km" }],
      ["QSFP-100G-CWDM4-S", "Module QSFP28 100GBASE-CWDM4 monomode, classe S", { "Débit": "100 Gbit/s", "Portée": "2 km" }],
      ["CVR-QSFP-SFP10G", "Adaptateur QSFP+ vers SFP+ (QSA)", { "Usage": "SFP+ 10G dans un port QSFP+" }],
    ]),
  ),
  ...family(
    { ...base, category: "Modules optiques SFP", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Module arrêté : Cisco le remplace par la version DOM / température étendue.` },
    optics([
      ["GLC-SX-MM", "Module SFP 1000BASE-SX multimode 850 nm", { "Débit": "1 Gbit/s", "Portée": "550 m" }, "GLC-SX-MMD"],
      ["GLC-LH-SM", "Module SFP 1000BASE-LX/LH monomode 1310 nm", { "Débit": "1 Gbit/s", "Portée": "10 km" }, "GLC-LH-SMD"],
      ["GLC-ZX-SM", "Module SFP 1000BASE-ZX monomode 1550 nm", { "Débit": "1 Gbit/s", "Portée": "70 km" }, "GLC-ZX-SMD"],
      ["GLC-T", "Module SFP 1000BASE-T cuivre RJ45", { "Débit": "1 Gbit/s", "Média": "cuivre RJ45, 100 m" }, "GLC-TE"],
      ["SFP-GE-T", "Module SFP 1000BASE-T cuivre RJ45, température étendue", { "Débit": "1 Gbit/s", "Média": "cuivre RJ45, 100 m" }, "GLC-TE"],
    ]),
  ),

  // ── Alimentations ──────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations serveur et réseau", status: "active", confidence: 70,
      describe: (name) => `${name}, module d'alimentation Cisco remplaçable à chaud.` },
    [
      ["PWR-C1-1100WAC-P", "Alimentation 1100 W AC Platinum pour Catalyst 9300", { "Puissance": "1100 W", "Compatibilité": "Catalyst 9300" }],
      ["PWR-C5-125WAC", "Alimentation 125 W AC pour Catalyst 9200", { "Puissance": "125 W", "Compatibilité": "Catalyst 9200" }],
      ["PWR-C5-600WAC", "Alimentation 600 W AC pour Catalyst 9200", { "Puissance": "600 W", "Compatibilité": "Catalyst 9200" }],
      ["PWR-C5-1KWAC", "Alimentation 1000 W AC pour Catalyst 9200", { "Puissance": "1000 W", "Compatibilité": "Catalyst 9200" }],
    ],
  ),
  ...family(
    { ...base, category: "Alimentations serveur et réseau", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Alimentation arrêtée, remplacée par la version Platinum (-P) de même puissance.` },
    [
      ["PWR-C1-350WAC", "Alimentation 350 W AC pour Catalyst 3850 / 9300", { "Puissance": "350 W" }, { by: "PWR-C1-350WAC-P" }],
      ["PWR-C1-1100WAC", "Alimentation 1100 W AC pour Catalyst 3850 / 9300", { "Puissance": "1100 W" }, { by: "PWR-C1-1100WAC-P" }],
      ["PWR-C2-640WAC", "Alimentation 640 W AC pour Catalyst 3650 / 2960-XR", { "Puissance": "640 W" }],
      ["PWR-C2-1025WAC", "Alimentation 1025 W AC pour Catalyst 3650 / 2960-XR", { "Puissance": "1025 W" }],
    ],
  ),

  // ── Modules réseau, piles, mémoire ─────────────────────────────────────────
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "active", confidence: 70,
      describe: (name) => `${name}, module d'extension Cisco.` },
    [
      ["C9200-NM-4G", "Module de liaisons montantes Catalyst 9200, 4 x 1G SFP", { "Ports": "4 x 1G SFP" }],
      ["C9200-NM-4X", "Module de liaisons montantes Catalyst 9200, 4 x 10G SFP+", { "Ports": "4 x 10G SFP+" }],
      ["C9300-NM-2Q", "Module de liaisons montantes Catalyst 9300, 2 x 40G QSFP+", { "Ports": "2 x 40G QSFP+" }],
      ["C9300-NM-2Y", "Module de liaisons montantes Catalyst 9300, 2 x 25G SFP28", { "Ports": "2 x 25G SFP28" }],
      ["STACK-T1-50CM", "Câble StackWise-480 50 cm", { "Longueur": "50 cm" }],
      ["STACK-T1-1M", "Câble StackWise-480 1 m", { "Longueur": "1 m" }],
      ["STACK-T1-3M", "Câble StackWise-480 3 m", { "Longueur": "3 m" }],
      ["NIM-1GE-CU-SFP", "Module NIM 1 port GbE cuivre ou SFP", { "Ports": "1 x 1G RJ45/SFP" }],
      ["NIM-2GE-CU-SFP", "Module NIM 2 ports GbE cuivre ou SFP", { "Ports": "2 x 1G RJ45/SFP" }],
      ["NIM-ES2-4", "Module NIM commutateur 4 ports GbE", { "Ports": "4 x 1G" }],
      ["NIM-ES2-8", "Module NIM commutateur 8 ports GbE", { "Ports": "8 x 1G" }],
      ["NIM-2T", "Module NIM 2 ports série WAN", { "Ports": "2 x série" }],
      ["NIM-2FXS", "Module NIM voix 2 ports FXS", { "Ports": "2 x FXS" }],
      ["NIM-4FXO", "Module NIM voix 4 ports FXO", { "Ports": "4 x FXO" }],
      ["MEM-4300-16G", "Mémoire DRAM 16 Go pour ISR 4300", { "Capacité": "16 Go" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Module de liaisons montantes Catalyst 3850 arrêté avec la gamme.` },
    [
      ["C3850-NM-4-1G", "Module de liaisons montantes Catalyst 3850, 4 x 1G SFP", { "Ports": "4 x 1G SFP" }, { by: "C9300-NM-4G" }],
      ["C3850-NM-2-10G", "Module de liaisons montantes Catalyst 3850, 2 x 10G SFP+ / 4 x 1G", { "Ports": "2 x 10G SFP+" }],
      ["C3850-NM-4-10G", "Module de liaisons montantes Catalyst 3850, 4 x 10G SFP+", { "Ports": "4 x 10G SFP+" }, { by: "C9300-NM-8X" }],
    ],
  ),
];
