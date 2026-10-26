import { family } from "../lib";

const base = { manufacturer: "HPE", industry: "informatique" } as const;

export const hpe = [
  // ── Alimentations ProLiant ─────────────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations serveur et réseau", status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Alimentation Common Slot remplaçable à chaud des serveurs ProLiant Gen8, gamme arrêtée.` },
    [
      ["656362-B21", "Alimentation 460 W Common Slot Platinum ProLiant Gen8", { "Puissance": "460 W", "Format": "Common Slot" }],
      ["656363-B21", "Alimentation 750 W Common Slot Platinum Plus ProLiant Gen8", { "Puissance": "750 W", "Format": "Common Slot" }],
    ],
  ),
  ...family(
    { ...base, category: "Alimentations serveur et réseau", status: "unknown", confidence: 65,
      describe: (name) => `${name}. Alimentation Flex Slot remplaçable à chaud des serveurs ProLiant.` },
    [["720479-B21", "Alimentation 800 W Flex Slot Platinum ProLiant Gen9", { "Puissance": "800 W", "Format": "Flex Slot" }]],
  ),
  ...family(
    { ...base, category: "Alimentations serveur et réseau", status: "active", confidence: 60,
      describe: (name) => `${name}. Alimentation Flex Slot remplaçable à chaud des serveurs ProLiant Gen10 Plus et Gen11.` },
    [["P38995-B21", "Alimentation 800 W Flex Slot Platinum ProLiant Gen10 Plus / Gen11", { "Puissance": "800 W", "Format": "Flex Slot" }]],
  ),

  // ── Disques SAS SFF ────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Stockage serveur", status: "unknown", confidence: 65,
      describe: (name) => `${name}. Disque dur SAS 12G 2,5" (SFF) en tiroir Smart Carrier pour ProLiant Gen8 à Gen10.` },
    [
      ["872475-B21", "Disque 300 Go SAS 12G 10K SFF SC Gen10", { "Capacité": "300 Go", "Vitesse": "10 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
      ["872477-B21", "Disque 600 Go SAS 12G 10K SFF SC Gen10", { "Capacité": "600 Go", "Vitesse": "10 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
      ["872481-B21", "Disque 1,8 To SAS 12G 10K SFF SC 512e Gen10", { "Capacité": "1,8 To", "Vitesse": "10 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
      ["870753-B21", "Disque 300 Go SAS 12G 15K SFF SC Gen10", { "Capacité": "300 Go", "Vitesse": "15 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
      ["870757-B21", "Disque 600 Go SAS 12G 15K SFF SC Gen10", { "Capacité": "600 Go", "Vitesse": "15 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
      ["870759-B21", "Disque 900 Go SAS 12G 15K SFF SC Gen10", { "Capacité": "900 Go", "Vitesse": "15 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
    ],
  ),
  ...family(
    { ...base, category: "Stockage serveur", status: "active", confidence: 60,
      describe: (name) => `${name}. Disque dur SAS 12G 2,5" Mission Critical multi-fournisseur, tiroir Basic Carrier (ProLiant Gen10 Plus / Gen11).` },
    [
      ["P28028-B21", "Disque 600 Go SAS 12G 10K SFF BC Multi Vendor", { "Capacité": "600 Go", "Vitesse": "10 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
      ["P28586-B21", "Disque 1,2 To SAS 12G 10K SFF BC Multi Vendor", { "Capacité": "1,2 To", "Vitesse": "10 000 tr/min", "Interface": "SAS 12 Gbit/s" }],
    ],
  ),
  ...family(
    { ...base, category: "Stockage serveur", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Disque de génération précédente arrêté : HPE le remplace par l'équivalent de génération suivante (tiroir Smart Carrier compatible).` },
    [
      ["785067-B21", "Disque 300 Go SAS 12G 10K SFF SC Gen9", { "Capacité": "300 Go", "Vitesse": "10 000 tr/min" }, { by: "872475-B21" }],
      ["781516-B21", "Disque 600 Go SAS 12G 10K SFF SC Gen9", { "Capacité": "600 Go", "Vitesse": "10 000 tr/min" }, { by: "872477-B21" }],
      ["781518-B21", "Disque 1,2 To SAS 12G 10K SFF SC Gen9", { "Capacité": "1,2 To", "Vitesse": "10 000 tr/min" }, { by: "872479-B21" }],
      ["652564-B21", "Disque 300 Go SAS 6G 10K SFF SC Gen8", { "Capacité": "300 Go", "Vitesse": "10 000 tr/min" }, { by: "785067-B21" }],
      ["652583-B21", "Disque 600 Go SAS 6G 10K SFF SC Gen8", { "Capacité": "600 Go", "Vitesse": "10 000 tr/min" }, { by: "781516-B21" }],
      ["581286-B21", "Disque 600 Go SAS 6G 10K SFF DP G7", { "Capacité": "600 Go", "Vitesse": "10 000 tr/min" }, { by: "652583-B21" }],
    ],
  ),

  // ── Mémoire ────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Barrette mémoire DDR4 Registered ProLiant Gen9, arrêtée.` },
    [
      ["726719-B21", "Mémoire 16 Go DDR4-2133 RDIMM 2Rx4 Gen9", { "Capacité": "16 Go", "Type": "DDR4-2133 RDIMM" }],
      ["728629-B21", "Mémoire 32 Go DDR4-2133 RDIMM 2Rx4 Gen9", { "Capacité": "32 Go", "Type": "DDR4-2133 RDIMM" }],
      ["805349-B21", "Mémoire 16 Go DDR4-2400 RDIMM 1Rx4 Gen9", { "Capacité": "16 Go", "Type": "DDR4-2400 RDIMM" }],
      ["805351-B21", "Mémoire 32 Go DDR4-2400 RDIMM 2Rx4 Gen9", { "Capacité": "32 Go", "Type": "DDR4-2400 RDIMM" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "unknown", confidence: 65,
      describe: (name) => `${name}. Barrette mémoire DDR4 Registered SmartMemory ProLiant Gen10.` },
    [
      ["815098-B21", "Mémoire 16 Go DDR4-2666 RDIMM 1Rx4 Gen10", { "Capacité": "16 Go", "Type": "DDR4-2666 RDIMM" }],
      ["815100-B21", "Mémoire 32 Go DDR4-2666 RDIMM 2Rx4 Gen10", { "Capacité": "32 Go", "Type": "DDR4-2666 RDIMM" }],
      ["P00920-B21", "Mémoire 16 Go DDR4-2933 RDIMM 2Rx8 Gen10", { "Capacité": "16 Go", "Type": "DDR4-2933 RDIMM" }],
      ["P00930-B21", "Mémoire 64 Go DDR4-2933 RDIMM 2Rx4 Gen10", { "Capacité": "64 Go", "Type": "DDR4-2933 RDIMM" }],
      ["P06033-B21", "Mémoire 32 Go DDR4-3200 RDIMM 2Rx4 Gen10 Plus", { "Capacité": "32 Go", "Type": "DDR4-3200 RDIMM" }],
      ["P06035-B21", "Mémoire 64 Go DDR4-3200 RDIMM 2Rx4 Gen10 Plus", { "Capacité": "64 Go", "Type": "DDR4-3200 RDIMM" }],
    ],
  ),

  // ── Cartes réseau ──────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Carte réseau ProLiant de génération précédente, arrêtée.` },
    [
      ["652503-B21", "Carte réseau 10 GbE 2 ports 530SFP+", { "Ports": "2 x 10G SFP+" }],
      ["652497-B21", "Carte réseau 1 GbE 4 ports 331FLR", { "Ports": "4 x 1G RJ45", "Format": "FlexibleLOM" }],
      ["647594-B21", "Carte réseau 1 GbE 4 ports 331T", { "Ports": "4 x 1G RJ45" }],
    ],
  ),
  ...family(
    { ...base, category: "Modules réseau et mémoire", status: "unknown", confidence: 65,
      describe: (name) => `${name}, carte réseau pour serveurs ProLiant.` },
    [
      ["727055-B21", "Carte réseau 10 GbE 2 ports 562SFP+", { "Ports": "2 x 10G SFP+" }],
      ["811546-B21", "Carte réseau 1 GbE 4 ports 366T", { "Ports": "4 x 1G RJ45" }],
      ["817749-B21", "Carte réseau 10/25 GbE 2 ports 640FLR-SFP28", { "Ports": "2 x 25G SFP28", "Format": "FlexibleLOM" }],
    ],
  ),

  // ── Contrôleurs Smart Array et batteries ───────────────────────────────────
  ...family(
    { ...base, category: "Contrôleurs RAID", status: "unknown", confidence: 65,
      describe: (name) => `${name}. Contrôleur RAID Smart Array SR Gen10 (SAS/SATA 12G).` },
    [
      ["804338-B21", "Contrôleur Smart Array P816i-a SR Gen10 4 Go", { "Cache": "4 Go", "Format": "modulaire AROC" }],
      ["830824-B21", "Contrôleur Smart Array P408i-p SR Gen10 2 Go", { "Cache": "2 Go", "Format": "carte PCIe" }],
      ["804405-B21", "Contrôleur Smart Array P408e-p SR Gen10 4 Go, ports externes", { "Cache": "4 Go", "Format": "carte PCIe" }],
    ],
  ),
  ...family(
    { ...base, category: "Contrôleurs RAID", status: "obsolete", confidence: 60,
      describe: (name) => `${name}. Contrôleur Smart Array Gen9 arrêté.` },
    [["726821-B21", "Contrôleur Smart Array P440 4 Go FBWC", { "Cache": "4 Go", "Format": "carte PCIe" }, { by: "830824-B21" }]],
  ),
  ...family(
    { ...base, category: "Contrôleurs RAID", status: "unknown", confidence: 60,
      describe: (name) => `${name} : batterie de sauvegarde du cache des contrôleurs Smart Array.` },
    [
      ["727258-B21", "Batterie Smart Storage 96 W, câble 145 mm (Gen9)", { "Câble": "145 mm" }],
      ["P01366-B21", "Batterie Smart Storage 96 W, câble 145 mm (Gen10)", { "Câble": "145 mm" }],
    ],
  ),
];
