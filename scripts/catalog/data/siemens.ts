import { family, replacedBy } from "../lib";

const base = { manufacturer: "Siemens", industry: "industrie" } as const;

const S7_300_PHASE_OUT =
  "Gamme SIMATIC S7-300 en phase-out : disponible en surplus ou reconditionné, migration vers S7-1500 recommandée par Siemens.";

export const siemens = [
  // ── S7-300 : CPU (phase-out, migration S7-1500) ────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "obsolete", confidence: 85,
      describe: (name) => `Automate SIMATIC S7-300, ${name}. ${S7_300_PHASE_OUT}` },
    [
      ["6ES7312-1AE14-0AB0", "CPU 312", { "Mémoire de travail": "32 Ko", "Interface": "MPI" }, replacedBy("6ES7511-1AK02-0AB0")],
      ["6ES7313-5BG04-0AB0", "CPU 313C (E/S intégrées)", { "Mémoire de travail": "128 Ko", "E/S intégrées": "24 DI / 16 DO, 5 AI / 2 AO" }, replacedBy("6ES7511-1CK01-0AB0")],
      ["6ES7313-6BG04-0AB0", "CPU 313C-2 PtP", { "Mémoire de travail": "128 Ko", "E/S intégrées": "16 DI / 16 DO", "Interfaces": "MPI + PtP RS422/485" }, replacedBy("6ES7511-1CK01-0AB0")],
      ["6ES7313-6CG04-0AB0", "CPU 313C-2 DP", { "Mémoire de travail": "128 Ko", "E/S intégrées": "16 DI / 16 DO", "Interfaces": "MPI + PROFIBUS DP" }, replacedBy("6ES7511-1CK01-0AB0")],
      ["6ES7314-6BH04-0AB0", "CPU 314C-2 PtP", { "Mémoire de travail": "192 Ko", "E/S intégrées": "24 DI / 16 DO, 5 AI / 2 AO" }, replacedBy("6ES7512-1CK01-0AB0")],
      ["6ES7314-6CH04-0AB0", "CPU 314C-2 DP", { "Mémoire de travail": "192 Ko", "Interfaces": "MPI + PROFIBUS DP" }, replacedBy("6ES7512-1CK01-0AB0")],
      ["6ES7314-6EH04-0AB0", "CPU 314C-2 PN/DP", { "Mémoire de travail": "192 Ko", "Interfaces": "PROFINET + MPI/PROFIBUS DP" }, replacedBy("6ES7512-1CK01-0AB0")],
      ["6ES7315-2EH14-0AB0", "CPU 315-2 PN/DP", { "Mémoire de travail": "384 Ko", "Interfaces": "PROFINET + MPI/PROFIBUS DP" }, replacedBy("6ES7515-2AM02-0AB0")],
      ["6ES7317-2EK14-0AB0", "CPU 317-2 PN/DP", { "Mémoire de travail": "1 Mo", "Interfaces": "PROFINET + MPI/PROFIBUS DP" }, replacedBy("6ES7516-3AN02-0AB0")],
      ["6ES7318-3EL01-0AB0", "CPU 319-3 PN/DP", { "Interfaces": "PROFINET + MPI/DP + PROFIBUS DP" }, replacedBy("6ES7517-3AP00-0AB0")],
      ["6ES7315-2FJ14-0AB0", "CPU 315F-2 PN/DP (sécurité)", { "Sécurité": "SIL 3 / PL e" }, replacedBy("6ES7515-2FM02-0AB0")],
      ["6ES7317-2FK14-0AB0", "CPU 317F-2 PN/DP (sécurité)", { "Sécurité": "SIL 3 / PL e" }, replacedBy("6ES7516-3FN02-0AB0")],
    ],
  ),

  // ── S7-300 / ET 200M : modules (phase-out) ─────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "obsolete", confidence: 85,
      describe: (name) => `${name} pour automate SIMATIC S7-300 et périphérie ET 200M. ${S7_300_PHASE_OUT}` },
    [
      ["6ES7321-1BL00-0AA0", "Module SM 321, 32 entrées TOR 24 V DC", { "Voies": "32 DI", "Tension": "24 V DC" }],
      ["6ES7322-1BL00-0AA0", "Module SM 322, 32 sorties TOR 24 V DC / 0,5 A", { "Voies": "32 DO", "Courant de sortie": "0,5 A" }],
      ["6ES7322-1HF01-0AA0", "Module SM 322, 8 sorties relais", { "Voies": "8 DO relais" }],
      ["6ES7322-1HH01-0AA0", "Module SM 322, 16 sorties relais", { "Voies": "16 DO relais" }],
      ["6ES7323-1BL00-0AA0", "Module SM 323, 16 entrées / 16 sorties TOR 24 V DC", { "Voies": "16 DI / 16 DO" }],
      ["6ES7331-7KB02-0AB0", "Module SM 331, 2 entrées analogiques 12 bits", { "Voies": "2 AI", "Résolution": "9 à 15 bits + signe" }],
      ["6ES7331-1KF02-0AB0", "Module SM 331, 8 entrées analogiques 13 bits", { "Voies": "8 AI", "Résolution": "13 bits" }],
      ["6ES7331-7NF00-0AB0", "Module SM 331, 8 entrées analogiques 16 bits", { "Voies": "8 AI", "Résolution": "15 bits + signe" }],
      ["6ES7332-5HD01-0AB0", "Module SM 332, 4 sorties analogiques", { "Voies": "4 AO", "Résolution": "11 à 12 bits" }],
      ["6ES7332-5HF00-0AB0", "Module SM 332, 8 sorties analogiques", { "Voies": "8 AO", "Résolution": "11 à 12 bits" }],
      ["6ES7340-1AH02-0AE0", "Processeur de communication CP 340 RS232C", { "Interface": "RS232C" }],
      ["6ES7341-1CH02-0AE0", "Processeur de communication CP 341 RS422/485", { "Interface": "RS422/485" }],
      ["6GK7343-1EX30-0XE0", "Processeur de communication CP 343-1 Ethernet", { "Interface": "Industrial Ethernet / PROFINET" }],
      ["6ES7153-1AA03-0XB0", "Coupleur IM 153-1 ET 200M PROFIBUS DP", { "Interface": "PROFIBUS DP" }],
      ["6ES7360-3AA01-0AA0", "Coupleur d'extension IM 360", null],
      ["6ES7361-3CA01-0AA0", "Coupleur d'extension IM 361", null],
      ["6ES7307-1EA01-0AA0", "Alimentation PS 307 24 V / 5 A", { "Sortie": "24 V DC / 5 A", "Entrée": "120/230 V AC" }, { category: "Alimentations industrielles" }],
      ["6ES7307-1KA02-0AA0", "Alimentation PS 307 24 V / 10 A", { "Sortie": "24 V DC / 10 A", "Entrée": "120/230 V AC" }, { category: "Alimentations industrielles" }],
    ],
  ),

  // ── S7-1200 : CPU ──────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 90,
      describe: (name) => `Automate compact SIMATIC S7-1200, ${name}, programmable dans TIA Portal, interface PROFINET intégrée.` },
    [
      ["6ES7211-1AE40-0XB0", "CPU 1211C DC/DC/DC", { "E/S TOR": "6 E / 4 S transistor", "Entrées analogiques": "2", "Mémoire de travail": "50 Ko", "Alimentation": "24 V DC" }],
      ["6ES7211-1BE40-0XB0", "CPU 1211C AC/DC/relais", { "E/S TOR": "6 E / 4 S relais", "Mémoire de travail": "50 Ko", "Alimentation": "120/230 V AC" }],
      ["6ES7211-1HE40-0XB0", "CPU 1211C DC/DC/relais", { "E/S TOR": "6 E / 4 S relais", "Mémoire de travail": "50 Ko", "Alimentation": "24 V DC" }],
      ["6ES7212-1BE40-0XB0", "CPU 1212C AC/DC/relais", { "E/S TOR": "8 E / 6 S relais", "Mémoire de travail": "75 Ko", "Alimentation": "120/230 V AC" }],
      ["6ES7212-1HE40-0XB0", "CPU 1212C DC/DC/relais", { "E/S TOR": "8 E / 6 S relais", "Mémoire de travail": "75 Ko", "Alimentation": "24 V DC" }],
      ["6ES7214-1BG40-0XB0", "CPU 1214C AC/DC/relais", { "E/S TOR": "14 E / 10 S relais", "Mémoire de travail": "100 Ko", "Alimentation": "120/230 V AC" }],
      ["6ES7214-1HG40-0XB0", "CPU 1214C DC/DC/relais", { "E/S TOR": "14 E / 10 S relais", "Mémoire de travail": "100 Ko", "Alimentation": "24 V DC" }],
      ["6ES7215-1BG40-0XB0", "CPU 1215C AC/DC/relais", { "E/S TOR": "14 E / 10 S relais", "Mémoire de travail": "125 Ko", "Alimentation": "120/230 V AC" }],
      ["6ES7215-1HG40-0XB0", "CPU 1215C DC/DC/relais", { "E/S TOR": "14 E / 10 S relais", "Mémoire de travail": "125 Ko", "Alimentation": "24 V DC" }],
      ["6ES7214-1AF40-0XB0", "CPU 1214FC DC/DC/DC (sécurité)", { "E/S TOR": "14 E / 10 S", "Sécurité": "SIL 3 / PL e" }],
      ["6ES7215-1AF40-0XB0", "CPU 1215FC DC/DC/DC (sécurité)", { "E/S TOR": "14 E / 10 S", "Sécurité": "SIL 3 / PL e" }],
      ["6ES7211-1AE31-0XB0", "CPU 1211C DC/DC/DC (génération 3)", null,
        replacedBy("6ES7211-1AE40-0XB0", { desc: "Automate SIMATIC S7-1200, CPU 1211C de génération 3, n'est plus fabriquée : remplacement direct par la génération 4." })],
      ["6ES7212-1AE31-0XB0", "CPU 1212C DC/DC/DC (génération 3)", null,
        replacedBy("6ES7212-1AE40-0XB0", { desc: "Automate SIMATIC S7-1200, CPU 1212C de génération 3, n'est plus fabriquée : remplacement direct par la génération 4." })],
      ["6ES7215-1AG31-0XB0", "CPU 1215C DC/DC/DC (génération 3)", null,
        replacedBy("6ES7215-1AG40-0XB0", { desc: "Automate SIMATIC S7-1200, CPU 1215C de génération 3, n'est plus fabriquée : remplacement direct par la génération 4." })],
    ],
  ),

  // ── S7-1200 : modules ──────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 85,
      describe: (name) => `${name}, module d'extension pour automate SIMATIC S7-1200.` },
    [
      ["6ES7221-1BF32-0XB0", "SM 1221, 8 entrées TOR 24 V DC", { "Voies": "8 DI", "Tension": "24 V DC" }],
      ["6ES7222-1BF32-0XB0", "SM 1222, 8 sorties TOR 24 V DC / 0,5 A", { "Voies": "8 DO transistor" }],
      ["6ES7222-1BH32-0XB0", "SM 1222, 16 sorties TOR 24 V DC / 0,5 A", { "Voies": "16 DO transistor" }],
      ["6ES7222-1HF32-0XB0", "SM 1222, 8 sorties relais 2 A", { "Voies": "8 DO relais" }],
      ["6ES7223-1BH32-0XB0", "SM 1223, 8 entrées / 8 sorties TOR 24 V DC", { "Voies": "8 DI / 8 DO transistor" }],
      ["6ES7223-1PH32-0XB0", "SM 1223, 8 entrées 24 V DC / 8 sorties relais", { "Voies": "8 DI / 8 DO relais" }],
      ["6ES7223-1BL32-0XB0", "SM 1223, 16 entrées / 16 sorties TOR 24 V DC", { "Voies": "16 DI / 16 DO transistor" }],
      ["6ES7223-1PL32-0XB0", "SM 1223, 16 entrées 24 V DC / 16 sorties relais", { "Voies": "16 DI / 16 DO relais" }],
      ["6ES7231-4HF32-0XB0", "SM 1231, 8 entrées analogiques", { "Voies": "8 AI", "Signaux": "±10 V, ±5 V, ±2,5 V, 0/4-20 mA" }],
      ["6ES7231-5PD32-0XB0", "SM 1231 RTD, 4 entrées sondes de température", { "Voies": "4 AI RTD" }],
      ["6ES7231-5QD32-0XB0", "SM 1231 TC, 4 entrées thermocouples", { "Voies": "4 AI thermocouple" }],
      ["6ES7232-4HB32-0XB0", "SM 1232, 2 sorties analogiques", { "Voies": "2 AO", "Signaux": "±10 V, 0-20 mA" }],
      ["6ES7232-4HD32-0XB0", "SM 1232, 4 sorties analogiques", { "Voies": "4 AO", "Signaux": "±10 V, 0-20 mA" }],
      ["6ES7234-4HE32-0XB0", "SM 1234, 4 entrées / 2 sorties analogiques", { "Voies": "4 AI / 2 AO" }],
      ["6ES7241-1AH32-0XB0", "Module de communication CM 1241 RS232", { "Interface": "RS232" }],
      ["6ES7241-1CH30-1XB0", "Carte de communication CB 1241 RS485", { "Interface": "RS485", "Montage": "en façade de la CPU" }],
      ["6GK7243-1BX30-0XE0", "Processeur de communication CP 1243-1 Ethernet", { "Interface": "Industrial Ethernet" }],
      ["6GK7243-5DX30-0XE0", "Module maître PROFIBUS DP CM 1243-5", { "Interface": "PROFIBUS DP maître" }],
    ],
  ),

  // ── Cartes mémoire SIMATIC (S7-1200 / S7-1500) ────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name} pour automates SIMATIC S7-1200 et S7-1500 : chargement de programme, firmware et archivage.` },
    [
      ["6ES7954-8LC03-0AA0", "SIMATIC Memory Card 4 Mo", { "Capacité": "4 Mo" }],
      ["6ES7954-8LE03-0AA0", "SIMATIC Memory Card 12 Mo", { "Capacité": "12 Mo" }],
      ["6ES7954-8LF03-0AA0", "SIMATIC Memory Card 24 Mo", { "Capacité": "24 Mo" }],
      ["6ES7954-8LL03-0AA0", "SIMATIC Memory Card 256 Mo", { "Capacité": "256 Mo" }],
      ["6ES7954-8LP03-0AA0", "SIMATIC Memory Card 2 Go", { "Capacité": "2 Go" }],
    ],
  ),

  // ── S7-1500 : CPU ──────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 80,
      describe: (name) => `Automate modulaire SIMATIC S7-1500, ${name}, programmable dans TIA Portal.` },
    [
      ["6ES7511-1CK01-0AB0", "CPU 1511C-1 PN (compacte)", { "Mémoire programme": "175 Ko", "E/S intégrées": "16 DI / 16 DQ, 5 AI / 2 AQ" }],
      ["6ES7512-1CK01-0AB0", "CPU 1512C-1 PN (compacte)", { "Mémoire programme": "250 Ko", "E/S intégrées": "32 DI / 32 DQ, 5 AI / 2 AQ" }],
      ["6ES7515-2AM02-0AB0", "CPU 1515-2 PN", { "Mémoire programme": "500 Ko", "Interfaces": "2 x PROFINET" }],
      ["6ES7517-3AP00-0AB0", "CPU 1517-3 PN/DP", { "Mémoire programme": "2 Mo", "Interfaces": "2 x PROFINET + PROFIBUS DP" }],
      ["6ES7518-4AP00-0AB0", "CPU 1518-4 PN/DP", { "Mémoire programme": "4 Mo", "Interfaces": "3 x PROFINET + PROFIBUS DP" }],
      ["6ES7511-1FK02-0AB0", "CPU 1511F-1 PN (sécurité)", { "Sécurité": "SIL 3 / PL e" }],
      ["6ES7513-1FL02-0AB0", "CPU 1513F-1 PN (sécurité)", { "Sécurité": "SIL 3 / PL e" }],
      ["6ES7515-2FM02-0AB0", "CPU 1515F-2 PN (sécurité)", { "Sécurité": "SIL 3 / PL e" }],
      ["6ES7516-3FN02-0AB0", "CPU 1516F-3 PN/DP (sécurité)", { "Sécurité": "SIL 3 / PL e" }],
      ["6ES7510-1DJ01-0AB0", "CPU 1510SP-1 PN (format ET 200SP)", { "Format": "ET 200SP" }],
      ["6ES7512-1DK01-0AB0", "CPU 1512SP-1 PN (format ET 200SP)", { "Format": "ET 200SP" }],
      ["6ES7511-1AK01-0AB0", "CPU 1511-1 PN (version 01)", null, replacedBy("6ES7511-1AK02-0AB0", { confidence: 75,
        desc: "Automate SIMATIC S7-1500, CPU 1511-1 PN de première version matérielle, remplacée par la version 02 de même référence de base." })],
      ["6ES7513-1AL01-0AB0", "CPU 1513-1 PN (version 01)", null, replacedBy("6ES7513-1AL02-0AB0", { confidence: 75,
        desc: "Automate SIMATIC S7-1500, CPU 1513-1 PN de première version matérielle, remplacée par la version 02." })],
      ["6ES7515-2AM01-0AB0", "CPU 1515-2 PN (version 01)", null, replacedBy("6ES7515-2AM02-0AB0", { confidence: 75,
        desc: "Automate SIMATIC S7-1500, CPU 1515-2 PN de première version matérielle, remplacée par la version 02." })],
      ["6ES7516-3AN01-0AB0", "CPU 1516-3 PN/DP (version 01)", null, replacedBy("6ES7516-3AN02-0AB0", { confidence: 75,
        desc: "Automate SIMATIC S7-1500, CPU 1516-3 PN/DP de première version matérielle, remplacée par la version 02." })],
    ],
  ),

  // ── S7-1500 : modules ──────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 85,
      describe: (name) => `${name} pour automate SIMATIC S7-1500 (connecteur frontal à commander séparément).` },
    [
      ["6ES7521-1BH00-0AB0", "Module DI 16x24VDC HF", { "Voies": "16 DI", "Tension": "24 V DC" }],
      ["6ES7521-1BL00-0AB0", "Module DI 32x24VDC HF", { "Voies": "32 DI", "Tension": "24 V DC" }],
      ["6ES7521-1BH10-0AA0", "Module DI 16x24VDC BA", { "Voies": "16 DI", "Tension": "24 V DC" }],
      ["6ES7522-1BH01-0AB0", "Module DQ 16x24VDC/0,5A ST", { "Voies": "16 DQ transistor" }],
      ["6ES7522-1BH10-0AA0", "Module DQ 16x24VDC/0,5A BA", { "Voies": "16 DQ transistor" }],
      ["6ES7522-5FF00-0AB0", "Module DQ 8x230VAC/2A ST", { "Voies": "8 DQ triac" }],
      ["6ES7522-5HF00-0AB0", "Module DQ 8x relais ST", { "Voies": "8 DQ relais" }],
      ["6ES7531-7KF00-0AB0", "Module AI 8xU/I/RTD/TC ST", { "Voies": "8 AI", "Résolution": "16 bits" }],
      ["6ES7531-7QD00-0AB0", "Module AI 4xU/I/RTD/TC ST", { "Voies": "4 AI", "Résolution": "16 bits" }],
      ["6ES7532-5HD00-0AB0", "Module AQ 4xU/I ST", { "Voies": "4 AQ", "Résolution": "16 bits" }],
      ["6ES7532-5NB00-0AB0", "Module AQ 2xU/I ST", { "Voies": "2 AQ", "Résolution": "16 bits" }],
      ["6ES7541-1AB00-0AB0", "Module de communication CM PtP RS422/485 HF", { "Interface": "RS422/485" }],
      ["6GK7543-1AX00-0XE0", "Processeur de communication CP 1543-1 Ethernet", { "Interface": "Industrial Ethernet" }],
      ["6ES7592-1AM00-0XB0", "Connecteur frontal 40 points à vis", { "Raccordement": "à vis" }],
      ["6ES7592-1BM00-0XB0", "Connecteur frontal 40 points push-in", { "Raccordement": "push-in" }],
      ["6ES7590-1AE80-0AA0", "Profilé support 482 mm", { "Longueur": "482 mm" }],
      ["6ES7505-0KA00-0AB0", "Alimentation système PS 25W 24VDC", { "Puissance": "25 W", "Entrée": "24 V DC" }, { category: "Alimentations industrielles" }],
      ["6ES7505-0RA00-0AB0", "Alimentation système PS 60W 24/48/60VDC", { "Puissance": "60 W", "Entrée": "24/48/60 V DC" }, { category: "Alimentations industrielles" }],
      ["6EP1332-4BA00", "Alimentation de charge PM 70W 120/230VAC", { "Sortie": "24 V DC / 3 A", "Entrée": "120/230 V AC" }, { category: "Alimentations industrielles" }],
      ["6EP1333-4BA00", "Alimentation de charge PM 190W 120/230VAC", { "Sortie": "24 V DC / 8 A", "Entrée": "120/230 V AC" }, { category: "Alimentations industrielles" }],
    ],
  ),

  // ── ET 200SP ───────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "active", confidence: 85,
      describe: (name) => `${name} pour système de périphérie décentralisée SIMATIC ET 200SP.` },
    [
      ["6ES7131-6BF01-0BA0", "Module DI 8x24VDC ST", { "Voies": "8 DI" }],
      ["6ES7132-6BF01-0BA0", "Module DQ 8x24VDC/0,5A ST", { "Voies": "8 DQ" }],
      ["6ES7132-6BD20-0BA0", "Module DQ 4x24VDC/2A ST", { "Voies": "4 DQ", "Courant de sortie": "2 A" }],
      ["6ES7134-6GD01-0BA1", "Module AI 4xI 2-/4-fils ST", { "Voies": "4 AI courant" }],
      ["6ES7134-6HD01-0BA1", "Module AI 4xU/I 2-fils ST", { "Voies": "4 AI tension/courant" }],
      ["6ES7134-6JD00-0CA1", "Module AI 4xRTD/TC HF", { "Voies": "4 AI RTD/thermocouple" }],
      ["6ES7135-6HD00-0BA1", "Module AQ 4xU/I ST", { "Voies": "4 AQ" }],
      ["6ES7137-6AA00-0BA0", "Module de communication CM PtP", { "Interface": "RS232/RS422/RS485" }],
      ["6ES7155-6AU01-0CN0", "Coupleur IM 155-6 PN HF", { "Interface": "PROFINET" }],
      ["6ES7155-6AR00-0AN0", "Coupleur IM 155-6 PN BA", { "Interface": "PROFINET" }],
      ["6ES7155-6BA01-0CN0", "Coupleur IM 155-6 DP HF", { "Interface": "PROFIBUS DP" }],
      ["6ES7193-6BP00-0DA0", "BaseUnit BU15-P16+A0+2D (clair, nouveau groupe de potentiel)", null],
      ["6ES7193-6BP00-0BA0", "BaseUnit BU15-P16+A0+2B (foncé)", null],
      ["6ES7193-6PA00-0AA0", "Module serveur ET 200SP", null],
    ],
  ),

  // ── ET 200S (phase-out → ET 200SP) ─────────────────────────────────────────
  ...family(
    { ...base, category: "Modules d'E/S déportées", status: "obsolete", confidence: 65,
      describe: (name) => `${name} pour périphérie décentralisée SIMATIC ET 200S, gamme en phase-out : migration vers ET 200SP conseillée par Siemens.` },
    [
      ["6ES7131-4BD01-0AA0", "Module électronique 4DI 24VDC ST", { "Voies": "4 DI" }, { by: "6ES7131-6BF01-0BA0" }],
      ["6ES7132-4BD02-0AA0", "Module électronique 4DO 24VDC/0,5A ST", { "Voies": "4 DO" }, { by: "6ES7132-6BF01-0BA0" }],
      ["6ES7138-4CA01-0AA0", "Module d'alimentation PM-E 24VDC", null],
      ["6ES7151-3AA23-0AB0", "Coupleur IM 151-3 PN", { "Interface": "PROFINET" }, { by: "6ES7155-6AU01-0BN0" }],
    ],
  ),

  // ── SINAMICS G120 modulaire : modules de puissance PM240-2 ────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 85,
      describe: (name) => `${name} SINAMICS G120 PM240-2 (sans filtre), 3 AC 380-480 V, à associer à une unité de contrôle CU240E-2 ou CU250S-2.` },
    [
      ["6SL3210-1PE11-8UL1", "Module de puissance 0,55 kW", { "Puissance": "0,55 kW", "Taille": "FSA" }],
      ["6SL3210-1PE12-3UL1", "Module de puissance 0,75 kW", { "Puissance": "0,75 kW", "Taille": "FSA" }],
      ["6SL3210-1PE13-2UL1", "Module de puissance 1,1 kW", { "Puissance": "1,1 kW", "Taille": "FSA" }],
      ["6SL3210-1PE14-3UL1", "Module de puissance 1,5 kW", { "Puissance": "1,5 kW", "Taille": "FSA" }],
      ["6SL3210-1PE16-1UL1", "Module de puissance 2,2 kW", { "Puissance": "2,2 kW", "Taille": "FSA" }],
      ["6SL3210-1PE18-0UL1", "Module de puissance 3 kW", { "Puissance": "3 kW", "Taille": "FSA" }],
      ["6SL3210-1PE21-1UL0", "Module de puissance 4 kW", { "Puissance": "4 kW", "Taille": "FSB" }],
      ["6SL3210-1PE21-4UL0", "Module de puissance 5,5 kW", { "Puissance": "5,5 kW", "Taille": "FSB" }],
      ["6SL3210-1PE21-8UL0", "Module de puissance 7,5 kW", { "Puissance": "7,5 kW", "Taille": "FSB" }],
      ["6SL3210-1PE22-7UL0", "Module de puissance 11 kW", { "Puissance": "11 kW", "Taille": "FSC" }],
      ["6SL3210-1PE23-3UL0", "Module de puissance 15 kW", { "Puissance": "15 kW", "Taille": "FSC" }],
    ],
  ),

  // ── SINAMICS G120 : unités de contrôle et pupitres ─────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 85,
      describe: (name) => `${name} pour variateur modulaire SINAMICS G120.` },
    [
      ["6SL3244-0BB12-1BA1", "Unité de contrôle CU240E-2 (USS/Modbus RTU)", { "Communication": "USS / Modbus RTU" }],
      ["6SL3244-0BB12-1FA0", "Unité de contrôle CU240E-2 PN (PROFINET)", { "Communication": "PROFINET / EtherNet/IP" }],
      ["6SL3244-0BB12-1PA1", "Unité de contrôle CU240E-2 DP (PROFIBUS)", { "Communication": "PROFIBUS DP" }],
      ["6SL3244-0BB13-1FA0", "Unité de contrôle CU240E-2 PN-F (sécurité)", { "Communication": "PROFINET", "Sécurité": "Safety Integrated" }],
      ["6SL3246-0BA22-1FA0", "Unité de contrôle CU250S-2 PN", { "Communication": "PROFINET" }],
      ["6SL3243-0BB30-1HA3", "Unité de contrôle CU230P-2 HVAC", { "Communication": "USS / Modbus RTU / BACnet" }],
      ["6SL3255-0AA00-4CA1", "Pupitre opérateur BOP-2", null],
      ["6SL3255-0AA00-4JA2", "Pupitre opérateur intelligent IOP-2", null],
      ["6SL3255-0AA00-4JA0", "Pupitre opérateur intelligent IOP (1re génération)", null, replacedBy("6SL3255-0AA00-4JA2", { confidence: 75 })],
    ],
  ),

  // ── SINAMICS G120C (compléments de gamme) ──────────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "active", confidence: 85,
      describe: (name) => `${name} : variateur de fréquence compact SINAMICS G120C, 3 AC 380-480 V, successeur de la gamme MICROMASTER.` },
    [
      ["6SL3210-1KE12-3UF1", "Variateur SINAMICS G120C 0,75 kW", { "Puissance": "0,75 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE13-2UF1", "Variateur SINAMICS G120C 1,1 kW", { "Puissance": "1,1 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE14-3UF1", "Variateur SINAMICS G120C 1,5 kW", { "Puissance": "1,5 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE17-5UF1", "Variateur SINAMICS G120C 3 kW", { "Puissance": "3 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE18-8UF1", "Variateur SINAMICS G120C 4 kW", { "Puissance": "4 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE21-7UF1", "Variateur SINAMICS G120C 7,5 kW", { "Puissance": "7,5 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE23-2UF1", "Variateur SINAMICS G120C 15 kW", { "Puissance": "15 kW", "Communication": "USS / Modbus RTU" }],
      ["6SL3210-1KE13-2AP1", "Variateur SINAMICS G120C PN 1,1 kW (filtre classe A)", { "Puissance": "1,1 kW", "Communication": "PROFINET" }],
      ["6SL3210-1KE15-8AP1", "Variateur SINAMICS G120C PN 2,2 kW (filtre classe A)", { "Puissance": "2,2 kW", "Communication": "PROFINET" }],
      ["6SL3210-1KE21-3AP1", "Variateur SINAMICS G120C PN 5,5 kW (filtre classe A)", { "Puissance": "5,5 kW", "Communication": "PROFINET" }],
    ],
  ),

  // ── MICROMASTER 4 (arrêtés → SINAMICS G120C) ───────────────────────────────
  ...family(
    { ...base, category: "Variateurs de vitesse", status: "obsolete", confidence: 85,
      describe: (name) => `${name}, 3 AC 380-480 V. Gamme MICROMASTER 4 arrêtée : successeur conseillé par Siemens, SINAMICS G120C de même puissance.` },
    [
      ["6SE6420-2UD17-5AA1", "Variateur MICROMASTER 420, 0,75 kW", { "Puissance": "0,75 kW", "Taille": "A" }, { by: "6SL3210-1KE12-3UF1" }],
      ["6SE6420-2UD21-5AA1", "Variateur MICROMASTER 420, 1,5 kW", { "Puissance": "1,5 kW", "Taille": "A" }, { by: "6SL3210-1KE14-3UF1" }],
      ["6SE6420-2UD22-2BA1", "Variateur MICROMASTER 420, 2,2 kW", { "Puissance": "2,2 kW", "Taille": "B" }, { by: "6SL3210-1KE15-8UF1" }],
      ["6SE6420-2UD23-0BA1", "Variateur MICROMASTER 420, 3 kW", { "Puissance": "3 kW", "Taille": "B" }, { by: "6SL3210-1KE17-5UF1" }],
      ["6SE6420-2UD24-0BA1", "Variateur MICROMASTER 420, 4 kW", { "Puissance": "4 kW", "Taille": "B" }, { by: "6SL3210-1KE18-8UF1" }],
      ["6SE6440-2UD17-5AA1", "Variateur MICROMASTER 440, 0,75 kW", { "Puissance": "0,75 kW", "Taille": "A" }, { by: "6SL3210-1KE12-3UF1" }],
      ["6SE6440-2UD24-0BA1", "Variateur MICROMASTER 440, 4 kW", { "Puissance": "4 kW", "Taille": "B" }, { by: "6SL3210-1KE18-8UF1" }],
      ["6SE6440-2UD27-5CA1", "Variateur MICROMASTER 440, 7,5 kW", { "Puissance": "7,5 kW", "Taille": "C" }, { by: "6SL3210-1KE21-7UF1" }],
      ["6SE6440-2UD31-1CA1", "Variateur MICROMASTER 440, 11 kW", { "Puissance": "11 kW", "Taille": "C" }, { by: "6SL3210-1KE22-6UF1" }],
      ["6SE6400-0BP00-0AA1", "Panneau opérateur BOP pour MICROMASTER 4", null, { desc: "Panneau opérateur de base (BOP) pour variateurs MICROMASTER 420/430/440, gamme arrêtée." }],
      ["6SE6400-1PB00-0AA0", "Module de communication PROFIBUS pour MICROMASTER 4", { "Communication": "PROFIBUS DP" },
        { desc: "Module PROFIBUS DP pour variateurs MICROMASTER 420/430/440, gamme arrêtée." }],
    ],
  ),

  // ── SITOP ──────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Alimentations industrielles", status: "active", confidence: 80,
      describe: (name) => `${name} : alimentation stabilisée sur rail DIN, sortie 24 V DC.` },
    [
      ["6EP1332-2BA20", "Alimentation SITOP PSU100S 24 V / 2,5 A", { "Sortie": "24 V DC / 2,5 A", "Entrée": "120/230 V AC" }],
      ["6EP1333-2BA20", "Alimentation SITOP PSU100S 24 V / 5 A", { "Sortie": "24 V DC / 5 A", "Entrée": "120/230 V AC" }],
      ["6EP1333-3BA10", "Alimentation SITOP PSU8200 24 V / 5 A", { "Sortie": "24 V DC / 5 A", "Entrée": "120/230 V AC" }],
      ["6EP1334-3BA10", "Alimentation SITOP PSU8200 24 V / 10 A", { "Sortie": "24 V DC / 10 A", "Entrée": "120/230 V AC" }],
      ["6EP1436-3BA10", "Alimentation SITOP PSU8200 triphasée 24 V / 20 A", { "Sortie": "24 V DC / 20 A", "Entrée": "3 AC 400-500 V" }],
      ["6EP1437-3BA10", "Alimentation SITOP PSU8200 triphasée 24 V / 40 A", { "Sortie": "24 V DC / 40 A", "Entrée": "3 AC 400-500 V" }],
    ],
  ),

  // ── IHM ────────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "IHM et pupitres", status: "active", confidence: 85,
      describe: (name) => `${name}, pupitre opérateur SIMATIC HMI configurable dans TIA Portal (WinCC).` },
    [
      ["6AV2123-2DB03-0AX0", "KTP400 Basic 4\" PN", { "Écran": "4,3\" tactile + 4 touches", "Interface": "PROFINET" }],
      ["6AV2123-2MB03-0AX0", "KTP1200 Basic 12\" PN", { "Écran": "12\" tactile + 10 touches", "Interface": "PROFINET" }],
      ["6AV2124-0GC01-0AX0", "TP700 Comfort 7\"", { "Écran": "7\" tactile", "Interfaces": "PROFINET + MPI/PROFIBUS DP" }],
      ["6AV2124-0JC01-0AX0", "TP900 Comfort 9\"", { "Écran": "9\" tactile", "Interfaces": "PROFINET + MPI/PROFIBUS DP" }],
      ["6AV2124-1GC01-0AX0", "KP700 Comfort 7\" (à touches)", { "Écran": "7\" + touches", "Interfaces": "PROFINET + MPI/PROFIBUS DP" }],
      ["6AV6647-0AD11-3AX0", "KTP600 Basic color PN", null, replacedBy("6AV2123-2GB03-0AX0", {
        desc: "Pupitre SIMATIC KTP600 Basic couleur PROFINET (1re génération Basic Panels), n'est plus fabriqué : remplacé par le KTP700 Basic." })],
      ["6AV6647-0AA11-3AA0", "KTP400 Basic mono PN", null, replacedBy("6AV2123-2DB03-0AX0", {
        desc: "Pupitre SIMATIC KTP400 Basic monochrome PROFINET (1re génération), n'est plus fabriqué : remplacé par le KTP400 Basic 2e génération." })],
      ["6AV6647-0AF11-3AX0", "KTP1000 Basic color PN", null, replacedBy("6AV2123-2JB03-0AX0", {
        desc: "Pupitre SIMATIC KTP1000 Basic couleur PROFINET (1re génération), n'est plus fabriqué : remplacé par le KTP900 Basic." })],
      ["6AV6642-0BA01-1AX1", "TP177B 6\" PN/DP", null, replacedBy("6AV2124-0GC01-0AX0", { confidence: 75,
        desc: "Pupitre tactile SIMATIC TP177B 6\" PN/DP, n'est plus fabriqué : successeur conseillé TP700 Comfort." })],
      ["6AV6643-0CD01-1AX1", "MP277 10\" Touch", null, replacedBy("6AV2124-0MC01-0AX0", { confidence: 70,
        desc: "Multi Panel SIMATIC MP277 10\" tactile, n'est plus fabriqué : successeur conseillé TP1200 Comfort." })],
    ],
  ),

  // ── SCALANCE ───────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Commutateurs réseau", status: "active", confidence: 85,
      describe: (name) => `${name}, commutateur Industrial Ethernet pour rail DIN.` },
    [
      ["6GK5005-0BA00-1AB2", "Switch SCALANCE XB005, 5 ports", { "Ports": "5 x RJ45 10/100", "Type": "non managé" }],
      ["6GK5008-0BA10-1AB2", "Switch SCALANCE XB008, 8 ports", { "Ports": "8 x RJ45 10/100", "Type": "non managé" }],
      ["6GK5208-0BA00-2AC2", "Switch SCALANCE XC208, 8 ports", { "Ports": "8 x RJ45 10/100", "Type": "managé" }],
      ["6GK5216-0BA00-2AC2", "Switch SCALANCE XC216, 16 ports", { "Ports": "16 x RJ45 10/100", "Type": "managé" }],
    ],
  ),

  // ── LOGO! ──────────────────────────────────────────────────────────────────
  ...family(
    { ...base, category: "Automates programmables", status: "active", confidence: 75,
      describe: (name) => `${name}, module logique LOGO! 8 pour petites automatisations, serveur web intégré.` },
    [
      ["6ED1052-1MD08-0BA1", "LOGO! 12/24RCE", { "Alimentation": "12/24 V DC", "E/S": "8 DI (4 AI) / 4 DO relais", "Écran": "oui" }],
      ["6ED1052-1FB08-0BA1", "LOGO! 230RCE", { "Alimentation": "115/230 V AC/DC", "E/S": "8 DI / 4 DO relais", "Écran": "oui" }],
      ["6ED1052-1CC08-0BA1", "LOGO! 24CE", { "Alimentation": "24 V DC", "E/S": "8 DI (4 AI) / 4 DO transistor", "Écran": "oui" }],
      ["6ED1052-2MD08-0BA1", "LOGO! 12/24RCEo (sans écran)", { "Alimentation": "12/24 V DC", "E/S": "8 DI (4 AI) / 4 DO relais", "Écran": "non" }],
      ["6ED1055-1MB00-0BA2", "Module d'extension LOGO! DM8 12/24R", { "E/S": "4 DI / 4 DO relais" }],
      ["6ED1055-1CB10-0BA2", "Module d'extension LOGO! DM16 24", { "E/S": "8 DI / 8 DO transistor" }],
      ["6ED1055-1MA00-0BA2", "Module d'extension LOGO! AM2", { "E/S": "2 AI" }],
      ["6ED1052-1MD00-0BA6", "LOGO! 12/24RC (0BA6)", null, replacedBy("6ED1052-1MD08-0BA1", { confidence: 70,
        desc: "Module logique LOGO! 12/24RC de génération 0BA6, n'est plus fabriqué : remplacé par la génération LOGO! 8." })],
      ["6ED1052-1FB00-0BA6", "LOGO! 230RC (0BA6)", null, replacedBy("6ED1052-1FB08-0BA1", { confidence: 70,
        desc: "Module logique LOGO! 230RC de génération 0BA6, n'est plus fabriqué : remplacé par la génération LOGO! 8." })],
    ],
  ),
];
