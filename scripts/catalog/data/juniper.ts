import { family } from "../lib";

const base = { manufacturer: "Juniper Networks", industry: "informatique" } as const;

export const juniper = [
  // ── Commutateurs EX ────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Commutateurs réseau", status: "active", confidence: 65,
      describe: (name) => `${name}. Commutateur Ethernet d'accès Juniper EX sous Junos OS, empilable (Virtual Chassis).` },
    [
      ["EX2300-24P", "Commutateur EX2300 24 ports GbE PoE+, 4 x 1/10G SFP+", { "Ports": "24 x 1G PoE+", "Liaisons montantes": "4 x 1/10G SFP+" }],
      ["EX2300-48P", "Commutateur EX2300 48 ports GbE PoE+, 4 x 1/10G SFP+", { "Ports": "48 x 1G PoE+", "Liaisons montantes": "4 x 1/10G SFP+" }],
      ["EX2300-C-12T", "Commutateur compact EX2300-C 12 ports GbE, 2 x 1/10G SFP+, sans ventilateur", { "Ports": "12 x 1G RJ45" }],
      ["EX2300-C-12P", "Commutateur compact EX2300-C 12 ports GbE PoE+, 2 x 1/10G SFP+, sans ventilateur", { "Ports": "12 x 1G PoE+" }],
      ["EX3400-48T", "Commutateur EX3400 48 ports GbE, 4 x 10G SFP+, 2 x 40G QSFP+", { "Ports": "48 x 1G RJ45" }],
      ["EX3400-24P", "Commutateur EX3400 24 ports GbE PoE+, 4 x 10G SFP+, 2 x 40G QSFP+", { "Ports": "24 x 1G PoE+" }],
      ["EX3400-48P", "Commutateur EX3400 48 ports GbE PoE+, 4 x 10G SFP+, 2 x 40G QSFP+", { "Ports": "48 x 1G PoE+" }],
      ["EX4400-24T", "Commutateur EX4400 24 ports GbE", { "Ports": "24 x 1G RJ45" }],
      ["EX4400-48T", "Commutateur EX4400 48 ports GbE", { "Ports": "48 x 1G RJ45" }],
      ["EX4400-24P", "Commutateur EX4400 24 ports GbE PoE+", { "Ports": "24 x 1G PoE+" }],
      ["EX4400-48P", "Commutateur EX4400 48 ports GbE PoE+", { "Ports": "48 x 1G PoE+" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "unknown", confidence: 65,
      describe: (name) => `${name}. Commutateur Ethernet Juniper EX4300 sous Junos OS, empilable (Virtual Chassis).` },
    [
      ["EX4300-24T", "Commutateur EX4300 24 ports GbE", { "Ports": "24 x 1G RJ45" }],
      ["EX4300-48T", "Commutateur EX4300 48 ports GbE", { "Ports": "48 x 1G RJ45" }],
      ["EX4300-24P", "Commutateur EX4300 24 ports GbE PoE+", { "Ports": "24 x 1G PoE+" }],
      ["EX4300-48P", "Commutateur EX4300 48 ports GbE PoE+", { "Ports": "48 x 1G PoE+" }],
    ],
  ),
  ...family(
    { ...base, category: "Commutateurs réseau", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Commutateur EX arrêté (fin de vie Juniper), remplacé par son successeur dans la gamme EX.` },
    [
      ["EX2200-24P-4G", "Commutateur EX2200 24 ports GbE PoE, 4 x 1G SFP", { "Ports": "24 x 1G PoE" }, { by: "EX2300-24P" }],
      ["EX2200-48P-4G", "Commutateur EX2200 48 ports GbE PoE, 4 x 1G SFP", { "Ports": "48 x 1G PoE" }, { by: "EX2300-48P" }],
      ["EX2200-C-12T-2G", "Commutateur compact EX2200-C 12 ports GbE, 2 x 1G SFP", { "Ports": "12 x 1G RJ45" }, { by: "EX2300-C-12T" }],
      ["EX2200-C-12P-2G", "Commutateur compact EX2200-C 12 ports GbE PoE+, 2 x 1G SFP", { "Ports": "12 x 1G PoE+" }, { by: "EX2300-C-12P" }],
      ["EX3300-24T", "Commutateur EX3300 24 ports GbE, 4 x 10G SFP+", { "Ports": "24 x 1G RJ45" }, { by: "EX3400-24T" }],
      ["EX3300-48T", "Commutateur EX3300 48 ports GbE, 4 x 10G SFP+", { "Ports": "48 x 1G RJ45" }, { by: "EX3400-48T" }],
      ["EX3300-24P", "Commutateur EX3300 24 ports GbE PoE+, 4 x 10G SFP+", { "Ports": "24 x 1G PoE+" }, { by: "EX3400-24P" }],
      ["EX3300-48P", "Commutateur EX3300 48 ports GbE PoE+, 4 x 10G SFP+", { "Ports": "48 x 1G PoE+" }, { by: "EX3400-48P" }],
      ["EX4200-24T", "Commutateur EX4200 24 ports GbE", { "Ports": "24 x 1G RJ45" }, { by: "EX4300-24T" }],
      ["EX4200-48T", "Commutateur EX4200 48 ports GbE", { "Ports": "48 x 1G RJ45" }, { by: "EX4300-48T" }],
    ],
  ),

  // ── Pare-feux SRX ──────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "active", confidence: 60,
      describe: (name) => `${name}. Passerelle de services SRX (pare-feu, routage, SD-WAN) pour sites distants.` },
    [
      ["SRX340", "Passerelle de services SRX340, 16 ports GbE", { "Ports": "8 x 1G RJ45 + 8 x 1G SFP" }],
      ["SRX345", "Passerelle de services SRX345, 16 ports GbE", { "Ports": "8 x 1G RJ45 + 8 x 1G SFP" }],
      ["SRX380", "Passerelle de services SRX380, 16 ports GbE PoE+, 4 x 10G SFP+", { "Ports": "16 x 1G PoE+ + 4 x 10G SFP+" }],
    ],
  ),
  ...family(
    { ...base, category: "Routeurs et pare-feux", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Passerelle SRX de branche arrêtée, remplacée par la gamme SRX300.` },
    [
      ["SRX100H2", "Passerelle de services SRX100, 2 Go", null, { by: "SRX300" }],
      ["SRX110H2-VA", "Passerelle de services SRX110 avec VDSL2", null],
      ["SRX210HE2", "Passerelle de services SRX210", null, { by: "SRX320" }],
      ["SRX220H2", "Passerelle de services SRX220", null, { by: "SRX340" }],
      ["SRX240H2", "Passerelle de services SRX240", null, { by: "SRX345" }],
    ],
  ),

  // ── Modules optiques ───────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules optiques SFP", status: "active", confidence: 70,
      describe: (name) => `${name}, module enfichable à chaud pour équipements Juniper.` },
    [
      ["EX-SFP-1GE-LX", "Module SFP 1000BASE-LX monomode 1310 nm", { "Débit": "1 Gbit/s", "Portée": "10 km" }],
      ["EX-SFP-1GE-T", "Module SFP 1000BASE-T cuivre RJ45", { "Débit": "1 Gbit/s", "Média": "cuivre RJ45, 100 m" }],
      ["EX-SFP-10GE-ER", "Module SFP+ 10GBASE-ER monomode 1550 nm", { "Débit": "10 Gbit/s", "Portée": "40 km" }],
      ["EX-SFP-10GE-USR", "Module SFP+ 10GBASE-USR multimode courte portée", { "Débit": "10 Gbit/s", "Portée": "100 m OM3" }],
      ["EX-SFP-10GE-DAC-1M", "Câble twinax SFP+ 10G passif 1 m", { "Débit": "10 Gbit/s", "Longueur": "1 m" }],
      ["EX-SFP-10GE-DAC-3M", "Câble twinax SFP+ 10G passif 3 m", { "Débit": "10 Gbit/s", "Longueur": "3 m" }],
      ["QFX-SFP-10GE-SR", "Module SFP+ 10GBASE-SR multimode 850 nm (QFX)", { "Débit": "10 Gbit/s", "Portée": "300 m OM3" }],
      ["QFX-SFP-10GE-LR", "Module SFP+ 10GBASE-LR monomode 1310 nm (QFX)", { "Débit": "10 Gbit/s", "Portée": "10 km" }],
      ["QFX-SFP-1GE-T", "Module SFP 1000BASE-T cuivre RJ45 (QFX)", { "Débit": "1 Gbit/s", "Média": "cuivre RJ45, 100 m" }],
      ["QFX-QSFP-40G-SR4", "Module QSFP+ 40GBASE-SR4 multimode (QFX)", { "Débit": "40 Gbit/s", "Portée": "150 m OM4" }],
      ["QFX-SFP-DAC-1M", "Câble twinax SFP+ 10G passif 1 m (QFX)", { "Débit": "10 Gbit/s", "Longueur": "1 m" }],
      ["QFX-SFP-DAC-3M", "Câble twinax SFP+ 10G passif 3 m (QFX)", { "Débit": "10 Gbit/s", "Longueur": "3 m" }],
    ],
  ),
];
