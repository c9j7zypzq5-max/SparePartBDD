import { family } from "../lib";

const base = { manufacturer: "Fortinet", industry: "informatique", category: "Routeurs et pare-feux" } as const;

export const fortinet = [
  ...family(
    { ...base, status: "active", confidence: 60,
      describe: (name) => `${name}. Pare-feu de nouvelle génération FortiGate (FortiOS) à processeur de sécurité dédié.` },
    [
      ["FG-90G", "Pare-feu FortiGate 90G", null],
      ["FG-120G", "Pare-feu FortiGate 120G", null],
      ["FG-200G", "Pare-feu FortiGate 200G", null],
    ],
  ),
  ...family(
    { ...base, status: "unknown", confidence: 70,
      describe: (name) => `${name}. Pare-feu de nouvelle génération FortiGate série F (FortiOS).` },
    [
      ["FG-40F", "Pare-feu FortiGate 40F, 5 ports GbE", { "Ports": "5 x 1G" }],
      ["FG-60F", "Pare-feu FortiGate 60F, 10 ports GbE", { "Ports": "10 x 1G" }],
      ["FG-61F", "Pare-feu FortiGate 61F, 10 ports GbE, stockage 128 Go", { "Ports": "10 x 1G", "Stockage": "128 Go" }],
      ["FG-80F", "Pare-feu FortiGate 80F", null],
      ["FG-81F", "Pare-feu FortiGate 81F, stockage 128 Go", { "Stockage": "128 Go" }],
      ["FG-100F", "Pare-feu FortiGate 100F", null],
      ["FG-101F", "Pare-feu FortiGate 101F, stockage 480 Go", { "Stockage": "480 Go" }],
      ["FG-200F", "Pare-feu FortiGate 200F", null],
      ["FG-201F", "Pare-feu FortiGate 201F, stockage 480 Go", { "Stockage": "480 Go" }],
      ["FG-400F", "Pare-feu FortiGate 400F", null],
      ["FG-600F", "Pare-feu FortiGate 600F", null],
    ],
  ),
  ...family(
    { ...base, status: "obsolete", confidence: 65,
      describe: (name) => `${name}. Fin de commande Fortinet : remplacé par le modèle de la série F de même gamme.` },
    [
      ["FG-30E", "Pare-feu FortiGate 30E", null, { by: "FG-40F" }],
      ["FG-50E", "Pare-feu FortiGate 50E", null, { by: "FG-40F" }],
      ["FG-60E", "Pare-feu FortiGate 60E", null, { by: "FG-60F" }],
      ["FG-61E", "Pare-feu FortiGate 61E", null, { by: "FG-61F" }],
      ["FG-80E", "Pare-feu FortiGate 80E", null, { by: "FG-80F" }],
      ["FG-100E", "Pare-feu FortiGate 100E", null, { by: "FG-100F" }],
      ["FG-200E", "Pare-feu FortiGate 200E", null, { by: "FG-200F" }],
      ["FG-300E", "Pare-feu FortiGate 300E", null, { by: "FG-400F" }],
      ["FG-500E", "Pare-feu FortiGate 500E", null, { by: "FG-600F" }],
    ],
  ),
  ...family(
    { ...base, status: "obsolete", confidence: 70,
      describe: (name) => `${name}. Fin de commande Fortinet : remplacé par la génération suivante.` },
    [
      ["FG-60D", "Pare-feu FortiGate 60D", null, { by: "FG-60E" }],
      ["FG-100D", "Pare-feu FortiGate 100D", null, { by: "FG-100E" }],
      ["FG-90D", "Pare-feu FortiGate 90D", null],
    ],
  ),
];
