#!/usr/bin/env python3
"""Génère neon-catalog.sql : catalogue industrie + informatique (~270 pièces).

Garantit la cohérence du schéma : références normalisées, slugs, FK,
séquences remises à jour. À exécuter puis coller la sortie dans Neon.
"""

import json
import re

TS = "2026-06-10 12:00:00"


def norm(ref: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", ref.upper())


def esc(s: str) -> str:
    return s.replace("'", "''")


def sqlstr(s):
    return "NULL" if s is None else f"'{esc(s)}'"


def sqljson(d):
    if not d:
        return "NULL"
    return "'" + esc(json.dumps(d, ensure_ascii=False)) + "'"


# ---------------------------------------------------------------- categories
CATEGORIES = [
    (1, "Automates programmables", "automates-programmables", "industrie"),
    (2, "Variateurs de vitesse", "variateurs-de-vitesse", "industrie"),
    (3, "Contacteurs et relais", "contacteurs-et-relais", "industrie"),
    (4, "Alimentations industrielles", "alimentations-industrielles", "industrie"),
    (5, "IHM et pupitres", "ihm-et-pupitres", "industrie"),
    (6, "Pneumatique", "pneumatique", "industrie"),
    (7, "Alimentations serveur et réseau", "alimentations-serveur-et-reseau", "informatique"),
    (8, "Modules optiques SFP", "modules-optiques-sfp", "informatique"),
    (9, "Commutateurs réseau", "commutateurs-reseau", "informatique"),
    (10, "Routeurs et pare-feux", "routeurs-et-pare-feux", "informatique"),
    (11, "Contrôleurs RAID", "controleurs-raid", "informatique"),
    (12, "Stockage serveur", "stockage-serveur", "informatique"),
    (13, "Modules réseau et mémoire", "modules-reseau-et-memoire", "informatique"),
    (14, "Batteries d'ordinateur portable", "batteries-d-ordinateur-portable", "informatique"),
    (15, "Instruments de mesure", "instruments-de-mesure", "industrie"),
    (16, "Modules d'E/S déportées", "modules-d-e-s-deportees", "industrie"),
    (17, "Capteurs industriels", "capteurs-industriels", "industrie"),
]

# ------------------------------------------------------------- manufacturers
MANUFACTURERS = [
    (1, "Siemens", "siemens", "industrie", "https://www.siemens.com"),
    (2, "Schneider Electric", "schneider-electric", "industrie", "https://www.se.com"),
    (3, "Rockwell Automation", "rockwell-automation", "industrie", "https://www.rockwellautomation.com"),
    (4, "ABB", "abb", "industrie", "https://www.abb.com"),
    (5, "Festo", "festo", "industrie", "https://www.festo.com"),
    (6, "SMC", "smc", "industrie", "https://www.smc.eu"),
    (7, "Keysight", "keysight", "industrie", "https://www.keysight.com"),
    (8, "Fluke", "fluke", "industrie", "https://www.fluke.com"),
    (9, "Omron", "omron", "industrie", "https://industrial.omron.eu"),
    (10, "Phoenix Contact", "phoenix-contact", "industrie", "https://www.phoenixcontact.com"),
    (11, "Cisco", "cisco", "informatique", "https://www.cisco.com"),
    (12, "Juniper Networks", "juniper-networks", "informatique", "https://www.juniper.net"),
    (13, "Dell", "dell", "informatique", "https://www.dell.com"),
    (14, "HPE", "hpe", "informatique", "https://www.hpe.com"),
    (15, "Lenovo", "lenovo", "informatique", "https://www.lenovo.com"),
]

# ------------------------------------------------------------------- sellers
SELLERS = [
    (1, "Siemens Industry Mall", "siemens-industry-mall", "constructeur", "https://mall.industry.siemens.com", "DE"),
    (2, "RS Components", "rs-components", "distributeur_officiel", "https://www.rs-online.com", "GB"),
    (3, "Farnell", "farnell", "distributeur_officiel", "https://www.farnell.com", "GB"),
    (4, "Radwell", "radwell", "reconditionne", "https://www.radwell.com", "US"),
    (5, "EU Automation", "eu-automation", "aftermarket", "https://www.euautomation.com", "GB"),
    (6, "Automation24", "automation24", "distributeur_officiel", "https://www.automation24.fr", "DE"),
    (7, "ServerSupply", "serversupply", "aftermarket", "https://www.serversupply.com", "US"),
    (8, "ETB Technologies", "etb-technologies", "reconditionne", "https://www.etb-tech.com", "GB"),
    (9, "eBay", "ebay", "occasion", "https://www.ebay.fr", "FR"),
    (10, "Keysight Direct", "keysight-direct", "constructeur", "https://www.keysight.com/fr/fr/buy.html", "FR"),
    (11, "TestEquity", "testequity", "distributeur_officiel", "https://www.testequity.com", "US"),
]
SELLER_URL = {s[0]: s[4] for s in SELLERS}

# ---------------------------------------------------------------------- parts
# (mfr_id, cat_id, ref, name, description, status, attributes|None, base_price, pool)
# pool : groupe de vendeurs pour les offres
P = []

# ============================ SIEMENS (1) ============================
P += [
    # S7-1200
    (1, 1, "6ES7212-1AE40-0XB0", "CPU S7-1200 1212C DC/DC/DC", "Automate SIMATIC S7-1200, CPU 1212C, 8 entrées / 6 sorties TOR, 2 entrées analogiques, mémoire 75 Ko.", "active", {"E/S TOR": "8 E / 6 S", "Mémoire": "75 Ko", "Alimentation": "24 V DC"}, 320, "auto"),
    (1, 1, "6ES7214-1AG40-0XB0", "CPU S7-1200 1214C DC/DC/DC", "Automate SIMATIC S7-1200, CPU 1214C, 14 entrées / 10 sorties TOR, 2 entrées analogiques, mémoire 100 Ko.", "active", {"E/S TOR": "14 E / 10 S", "Mémoire": "100 Ko", "Alimentation": "24 V DC"}, 520, "auto"),
    (1, 1, "6ES7214-1AG31-0XB0", "CPU S7-1200 1214C DC/DC/DC (gén. 3)", "Automate SIMATIC S7-1200, CPU 1214C génération 3. Phase-out : remplacé par 6ES7214-1AG40-0XB0.", "obsolete", None, 430, "auto"),
    (1, 1, "6ES7215-1AG40-0XB0", "CPU S7-1200 1215C DC/DC/DC", "Automate SIMATIC S7-1200, CPU 1215C, 14 entrées / 10 sorties TOR, 2 AI / 2 AO, 2 ports PROFINET.", "active", {"E/S TOR": "14 E / 10 S", "Mémoire": "125 Ko", "PROFINET": "2 ports"}, 690, "auto"),
    (1, 1, "6ES7217-1AG40-0XB0", "CPU S7-1200 1217C DC/DC/DC", "Automate SIMATIC S7-1200, CPU 1217C, le plus puissant de la gamme, E/S rapides 1 MHz.", "active", {"Mémoire": "150 Ko", "Sorties rapides": "1 MHz"}, 980, "auto"),
    (1, 16, "6ES7221-1BH32-0XB0", "Module SM 1221, 8 entrées TOR 24 V", "Module d'extension SM 1221 pour S7-1200, 8 entrées TOR 24 V DC.", "active", None, 120, "auto"),
    (1, 16, "6ES7222-1HH32-0XB0", "Module SM 1222, 8 sorties relais", "Module d'extension SM 1222 pour S7-1200, 8 sorties relais 2 A.", "active", None, 145, "auto"),
    (1, 16, "6ES7231-4HD32-0XB0", "Module SM 1231, 4 entrées analogiques", "Module d'extension SM 1231 pour S7-1200, 4 entrées analogiques ±10 V / 0-20 mA, 12 bits.", "active", None, 210, "auto"),
    (1, 16, "6ES7241-1CH32-0XB0", "Module CM 1241 RS422/485", "Module de communication CM 1241 pour S7-1200, interface RS422/485.", "active", None, 185, "auto"),
    # S7-300 (obsolète)
    (1, 1, "6ES7313-1AD03-0AB0", "CPU S7-300 313", "Automate SIMATIC S7-300, CPU 313. Gamme S7-300 en phase-out global, migration S7-1500 conseillée.", "obsolete", None, 450, "auto"),
    (1, 1, "6ES7314-1AG14-0AB0", "CPU S7-300 314", "Automate SIMATIC S7-300, CPU 314, mémoire 128 Ko. Gamme arrêtée, pièces en surplus uniquement.", "obsolete", {"Mémoire": "128 Ko"}, 520, "auto"),
    (1, 1, "6ES7315-2AH14-0AB0", "CPU S7-300 315-2 DP", "Automate SIMATIC S7-300, CPU 315-2 DP avec interface PROFIBUS. Phase-out global (PM410).", "obsolete", {"Mémoire": "256 Ko", "Interface": "MPI + PROFIBUS DP"}, 780, "auto"),
    (1, 1, "6ES7317-2AK14-0AB0", "CPU S7-300 317-2 DP/PN", "Automate SIMATIC S7-300, CPU 317-2 PN/DP, PROFINET + PROFIBUS. Gamme arrêtée.", "obsolete", {"Mémoire": "1 Mo"}, 1450, "auto"),
    (1, 16, "6ES7321-1BH02-0AA0", "Module SM 321, 16 entrées TOR", "Module d'entrées TOR SM 321 pour S7-300, 16 x 24 V DC. N'est plus fabriqué.", "obsolete", None, 130, "auto"),
    (1, 16, "6ES7322-1BH01-0AA0", "Module SM 322, 16 sorties TOR", "Module de sorties TOR SM 322 pour S7-300, 16 x 24 V DC / 0,5 A. N'est plus fabriqué.", "obsolete", None, 140, "auto"),
    (1, 16, "6ES7331-7KF02-0AB0", "Module SM 331, 8 entrées analogiques", "Module d'entrées analogiques SM 331 pour S7-300, 8 voies. N'est plus fabriqué.", "obsolete", None, 290, "auto"),
    # S7-1500
    (1, 1, "6ES7511-1AK02-0AB0", "CPU S7-1500 1511-1 PN", "Automate SIMATIC S7-1500, CPU 1511-1 PN, mémoire programme 150 Ko, PROFINET IRT.", "active", {"Mémoire": "150 Ko", "PROFINET": "2 ports"}, 1350, "auto"),
    (1, 1, "6ES7513-1AL02-0AB0", "CPU S7-1500 1513-1 PN", "Automate SIMATIC S7-1500, CPU 1513-1 PN, mémoire programme 300 Ko.", "active", {"Mémoire": "300 Ko"}, 1980, "auto"),
    (1, 1, "6ES7516-3AN02-0AB0", "CPU S7-1500 1516-3 PN/DP", "Automate SIMATIC S7-1500, CPU 1516-3 PN/DP, PROFINET + PROFIBUS, mémoire 1 Mo.", "active", {"Mémoire": "1 Mo", "Interfaces": "2x PROFINET + 1x PROFIBUS"}, 3450, "auto"),
    (1, 16, "6ES7521-1BL10-0AA0", "Module DI 32x24VDC HF S7-1500", "Module d'entrées TOR haute performance pour S7-1500, 32 x 24 V DC.", "active", None, 320, "auto"),
    (1, 16, "6ES7522-1BL01-0AB0", "Module DQ 32x24VDC/0,5A HF S7-1500", "Module de sorties TOR haute performance pour S7-1500, 32 x 24 V DC / 0,5 A.", "active", None, 380, "auto"),
    # ET 200SP
    (1, 16, "6ES7131-6BH01-0BA0", "ET 200SP DI 8x24VDC ST", "Module d'entrées TOR ET 200SP, 8 x 24 V DC, BaseUnit type A0.", "active", None, 95, "auto"),
    (1, 16, "6ES7132-6BH01-0BA0", "ET 200SP DQ 8x24VDC/0,5A ST", "Module de sorties TOR ET 200SP, 8 x 24 V DC / 0,5 A.", "active", None, 105, "auto"),
    (1, 16, "6ES7155-6AU01-0BN0", "ET 200SP IM 155-6 PN ST", "Coupleur PROFINET IM 155-6 PN Standard pour périphérie décentralisée ET 200SP.", "active", None, 280, "auto"),
    # SITOP
    (1, 4, "6EP1332-1SH43", "Alimentation SITOP PSU100S 24 V / 3 A", "Alimentation stabilisée SITOP smart monophasée, sortie 24 V DC 3 A, rail DIN.", "active", {"Sortie": "24 V DC / 3 A"}, 95, "auto"),
    (1, 4, "6EP1334-2BA20", "Alimentation SITOP PSU100S 24 V / 10 A", "Alimentation stabilisée SITOP smart, entrée 120/230 V AC, sortie 24 V DC 10 A, rail DIN.", "active", {"Sortie": "24 V DC / 10 A", "Entrée": "120-230 V AC"}, 145, "auto"),
    (1, 4, "6EP1336-3BA10", "Alimentation SITOP PSU100S 24 V / 20 A", "Alimentation stabilisée SITOP smart, sortie 24 V DC 20 A, rail DIN.", "active", {"Sortie": "24 V DC / 20 A"}, 265, "auto"),
    (1, 4, "6EP3333-8SB00-0AY0", "Alimentation SITOP PSU8200 24 V / 20 A", "Alimentation triphasée SITOP PSU8200, sortie 24 V DC 20 A, haut rendement.", "active", {"Sortie": "24 V DC / 20 A", "Entrée": "3x 400-500 V AC"}, 340, "auto"),
    (1, 4, "6EP1961-2BA21", "Module UPS SITOP UPS1600 24 V / 20 A", "Module d'alimentation sans interruption SITOP UPS1600, 24 V DC 20 A, gestion Ethernet/PROFINET.", "active", None, 420, "auto"),
    (1, 4, "6EP1931-2DC42", "Module tampon SITOP DC-UPS 24 V / 6 A", "Module DC-UPS avec batterie pour maintien d'alimentation 24 V, 6 A. Ancienne génération, n'est plus fabriqué.", "obsolete", None, 260, "auto"),
    # SINAMICS G120C
    (1, 2, "6SL3210-1KE11-8UF1", "Variateur SINAMICS G120C 0,75 kW", "Variateur de fréquence compact SINAMICS G120C 0,75 kW triphasé 400 V, filtre classe A, USS/Modbus.", "active", {"Puissance": "0,75 kW", "Tension": "380-480 V AC"}, 410, "auto"),
    (1, 2, "6SL3210-1KE15-8UF1", "Variateur SINAMICS G120C 3 kW", "Variateur de fréquence compact SINAMICS G120C 3 kW triphasé 400 V.", "active", {"Puissance": "3 kW", "Tension": "380-480 V AC"}, 540, "auto"),
    (1, 2, "6SL3210-1KE21-3UF1", "Variateur SINAMICS G120C 5,5 kW", "Variateur de fréquence compact SINAMICS G120C 5,5 kW, successeur de la gamme MICROMASTER.", "active", {"Puissance": "5,5 kW", "Tension": "380-480 V AC"}, 870, "auto"),
    (1, 2, "6SL3210-1KE22-6UF1", "Variateur SINAMICS G120C 11 kW", "Variateur de fréquence compact SINAMICS G120C 11 kW triphasé 400 V.", "active", {"Puissance": "11 kW", "Tension": "380-480 V AC"}, 1150, "auto"),
    (1, 2, "6SL3210-1KE24-0UF1", "Variateur SINAMICS G120C 18,5 kW", "Variateur de fréquence compact SINAMICS G120C 18,5 kW triphasé 400 V.", "active", {"Puissance": "18,5 kW", "Tension": "380-480 V AC"}, 1900, "auto"),
    # SINAMICS V20
    (1, 2, "6SL3210-5BB21-1UV1", "Variateur SINAMICS V20 1,1 kW", "Variateur de fréquence économique SINAMICS V20, 1,1 kW monophasé 230 V.", "active", {"Puissance": "1,1 kW", "Tension": "200-240 V AC"}, 230, "auto"),
    (1, 2, "6SL3210-5BE21-5UV0", "Variateur SINAMICS V20 1,5 kW 400 V", "Variateur de fréquence économique SINAMICS V20, 1,5 kW triphasé 400 V.", "active", {"Puissance": "1,5 kW", "Tension": "380-480 V AC"}, 260, "auto"),
    # MICROMASTER 440 (obsolète)
    (1, 2, "6SE6440-2UD13-7AA1", "Variateur MICROMASTER 440 0,37 kW", "Variateur MICROMASTER 440 0,37 kW. Gamme arrêtée, successeur : SINAMICS G120C.", "obsolete", {"Puissance": "0,37 kW"}, 340, "auto"),
    (1, 2, "6SE6440-2UD21-5AA1", "Variateur MICROMASTER 440 1,5 kW", "Variateur MICROMASTER 440 1,5 kW. Gamme arrêtée par Siemens, successeur conseillé : SINAMICS G120C.", "obsolete", {"Puissance": "1,5 kW"}, 450, "auto"),
    (1, 2, "6SE6440-2UD22-2BA1", "Variateur MICROMASTER 440 2,2 kW", "Variateur MICROMASTER 440 2,2 kW. Gamme arrêtée, disponible en surplus et reconditionné.", "obsolete", {"Puissance": "2,2 kW"}, 500, "auto"),
    (1, 2, "6SE6440-2UD25-5CA1", "Variateur MICROMASTER 440 5,5 kW", "Variateur MICROMASTER 440 5,5 kW. Gamme arrêtée, disponible en surplus et reconditionné.", "obsolete", {"Puissance": "5,5 kW"}, 720, "auto"),
    # SINAMICS G110 (obsolète)
    (1, 2, "6SL3211-0AB12-5UA1", "Variateur SINAMICS G110 0,25 kW", "Variateur SINAMICS G110 0,25 kW monophasé 230 V. Gamme arrêtée, successeur : SINAMICS V20.", "obsolete", {"Puissance": "0,25 kW"}, 290, "auto"),
    (1, 2, "6SL3211-0AB15-5BA1", "Variateur SINAMICS G110 0,55 kW", "Variateur SINAMICS G110 0,55 kW monophasé 230 V. Gamme arrêtée, successeur : SINAMICS V20.", "obsolete", {"Puissance": "0,55 kW"}, 330, "auto"),
    # HMI
    (1, 5, "6AV2123-2GB03-0AX0", "Pupitre KTP700 Basic 7\"", "IHM SIMATIC KTP700 Basic, écran tactile 7\" 800x480, PROFINET, 24 V DC.", "active", {"Écran": "7\" tactile", "Résolution": "800x480"}, 740, "auto"),
    (1, 5, "6AV2123-2JB03-0AX0", "Pupitre KTP900 Basic 9\"", "IHM SIMATIC KTP900 Basic, écran tactile 9\" 800x480, PROFINET.", "active", {"Écran": "9\" tactile"}, 950, "auto"),
    (1, 5, "6AV2124-0MC01-0AX0", "Pupitre TP1200 Comfort 12\"", "IHM SIMATIC TP1200 Comfort, écran tactile 12\" 1280x800, PROFINET + PROFIBUS.", "active", {"Écran": "12\" tactile", "Résolution": "1280x800"}, 2250, "auto"),
    (1, 5, "6AV2124-0QC02-0AX0", "Pupitre TP1500 Comfort 15\"", "IHM SIMATIC TP1500 Comfort, écran tactile 15\" 1280x800.", "active", {"Écran": "15\" tactile"}, 2600, "auto"),
    (1, 5, "6AV6648-0CC11-3AX0", "Pupitre KTP600 Basic Color PN", "IHM SIMATIC KTP600 Basic Color, écran 6\". N'est plus fabriqué, successeur : KTP700 Basic.", "obsolete", {"Écran": "6\" tactile"}, 480, "auto"),
    (1, 5, "6AV6545-0BC15-2AX0", "Pupitre TP170B", "Panneau opérateur SIMATIC TP170B monochrome. Obsolète depuis 2010, surplus uniquement.", "obsolete", None, 350, "auto"),
]

# ======================= SCHNEIDER ELECTRIC (2) ======================
P += [
    # ATV320
    (2, 2, "ATV320U04N4B", "Variateur Altivar Machine ATV320 0,37 kW", "Variateur de fréquence ATV320 format book, 0,37 kW 380-500 V.", "active", {"Puissance": "0,37 kW", "Tension": "380-500 V"}, 320, "auto"),
    (2, 2, "ATV320U15N4B", "Variateur Altivar Machine ATV320 1,5 kW", "Variateur de fréquence ATV320 format book, 1,5 kW 380-500 V, successeur de l'ATV312.", "active", {"Puissance": "1,5 kW", "Tension": "380-500 V"}, 420, "auto"),
    (2, 2, "ATV320U40N4B", "Variateur Altivar Machine ATV320 4 kW", "Variateur de fréquence ATV320 format book, 4 kW 380-500 V.", "active", {"Puissance": "4 kW"}, 620, "auto"),
    (2, 2, "ATV320U75N4B", "Variateur Altivar Machine ATV320 7,5 kW", "Variateur de fréquence ATV320, 7,5 kW 380-500 V.", "active", {"Puissance": "7,5 kW"}, 980, "auto"),
    (2, 2, "ATV320D11N4B", "Variateur Altivar Machine ATV320 11 kW", "Variateur de fréquence ATV320, 11 kW 380-500 V.", "active", {"Puissance": "11 kW"}, 1350, "auto"),
    # ATV312 (obsolète)
    (2, 2, "ATV312H018M2", "Variateur Altivar 312 0,18 kW", "Variateur ATV312 0,18 kW 200-240 V. Gamme retirée du catalogue, remplacement : ATV320.", "obsolete", {"Puissance": "0,18 kW"}, 280, "auto"),
    (2, 2, "ATV312HU15N4", "Variateur Altivar 312 1,5 kW", "Variateur ATV312 1,5 kW 380-500 V. Gamme retirée du catalogue, remplacement officiel : ATV320.", "obsolete", {"Puissance": "1,5 kW"}, 380, "auto"),
    (2, 2, "ATV312HU40N4", "Variateur Altivar 312 4 kW", "Variateur ATV312 4 kW 380-500 V. Gamme retirée, surplus et reconditionné uniquement.", "obsolete", {"Puissance": "4 kW"}, 520, "auto"),
    (2, 2, "ATV312HD11N4", "Variateur Altivar 312 11 kW", "Variateur ATV312 11 kW 380-500 V. Gamme retirée du catalogue.", "obsolete", {"Puissance": "11 kW"}, 890, "auto"),
    # ATV630
    (2, 2, "ATV630U07N4", "Variateur Altivar Process ATV630 0,75 kW", "Variateur process ATV630 0,75 kW 380-480 V, applications pompes et ventilateurs.", "active", {"Puissance": "0,75 kW"}, 850, "auto"),
    (2, 2, "ATV630D11N4", "Variateur Altivar Process ATV630 11 kW", "Variateur process ATV630 11 kW 380-480 V, services intégrés pompage.", "active", {"Puissance": "11 kW"}, 1950, "auto"),
    (2, 2, "ATV630D22N4", "Variateur Altivar Process ATV630 22 kW", "Variateur process ATV630 22 kW 380-480 V.", "active", {"Puissance": "22 kW"}, 2900, "auto"),
    # ATV21 (obsolète)
    (2, 2, "ATV21HU22N4", "Variateur Altivar 21 2,2 kW", "Variateur ATV21 2,2 kW pour HVAC. Gamme arrêtée, remplacée par ATV212 puis ATV320.", "obsolete", {"Puissance": "2,2 kW"}, 420, "auto"),
    # TeSys D
    (2, 3, "LC1D09M7", "Contacteur TeSys D 9 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 9 A AC-3, bobine 220-230 V 50/60 Hz, 1 NO + 1 NC.", "active", {"Calibre": "9 A AC-3", "Bobine": "220-230 V AC"}, 48, "auto"),
    (2, 3, "LC1D18M7", "Contacteur TeSys D 18 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 18 A AC-3, bobine 220-230 V 50/60 Hz.", "active", {"Calibre": "18 A AC-3", "Bobine": "220-230 V AC"}, 62, "auto"),
    (2, 3, "LC1D25M7", "Contacteur TeSys D 25 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 25 A AC-3.", "active", {"Calibre": "25 A AC-3"}, 78, "auto"),
    (2, 3, "LC1D32M7", "Contacteur TeSys D 32 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 32 A AC-3.", "active", {"Calibre": "32 A AC-3"}, 95, "auto"),
    (2, 3, "LC1D40AM7", "Contacteur TeSys D 40 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 40 A AC-3, bornes à vis.", "active", {"Calibre": "40 A AC-3"}, 145, "auto"),
    (2, 3, "LC1D65AM7", "Contacteur TeSys D 65 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 65 A AC-3.", "active", {"Calibre": "65 A AC-3"}, 210, "auto"),
    (2, 3, "LC1D80M7", "Contacteur TeSys D 80 A, bobine 220 V AC", "Contacteur tripolaire TeSys Deca 80 A AC-3.", "active", {"Calibre": "80 A AC-3"}, 280, "auto"),
    # TeSys F
    (2, 3, "LC1F115M7", "Contacteur TeSys F 115 A", "Contacteur tripolaire TeSys F 115 A AC-3, bobine 220 V AC.", "active", {"Calibre": "115 A AC-3"}, 420, "auto"),
    (2, 3, "LC1F150M7", "Contacteur TeSys F 150 A", "Contacteur tripolaire TeSys F 150 A AC-3.", "active", {"Calibre": "150 A AC-3"}, 540, "auto"),
    # Relais thermiques
    (2, 3, "LRD08", "Relais thermique TeSys LRD 2,5-4 A", "Relais de protection thermique TeSys LRD, plage 2,5-4 A, classe 10A.", "active", {"Plage": "2,5-4 A"}, 38, "auto"),
    (2, 3, "LRD14", "Relais thermique TeSys LRD 7-10 A", "Relais de protection thermique TeSys LRD, plage 7-10 A.", "active", {"Plage": "7-10 A"}, 42, "auto"),
    (2, 3, "LRD22", "Relais thermique TeSys LRD 16-24 A", "Relais de protection thermique TeSys LRD, plage 16-24 A.", "active", {"Plage": "16-24 A"}, 55, "auto"),
    # Modicon M221 / M241 / M262
    (2, 1, "TM221CE24R", "Automate Modicon M221, 24 E/S relais, Ethernet", "Contrôleur logique Modicon M221, 14 entrées / 10 sorties relais, port Ethernet.", "active", {"E/S": "14 E / 10 S relais", "Ethernet": "Oui"}, 245, "auto"),
    (2, 1, "TM221CE24T", "Automate Modicon M221, 24 E/S transistor, Ethernet", "Contrôleur logique Modicon M221, sorties transistor, port Ethernet.", "active", {"E/S": "14 E / 10 S transistor"}, 245, "auto"),
    (2, 1, "TM221C40R", "Automate Modicon M221, 40 E/S relais", "Contrôleur logique Modicon M221, 24 entrées / 16 sorties relais.", "active", {"E/S": "24 E / 16 S relais"}, 320, "auto"),
    (2, 1, "TM241CE24T", "Automate Modicon M241, 24 E/S, Ethernet", "Contrôleur machine Modicon M241, 24 E/S transistor, Ethernet + CANopen.", "active", {"E/S": "24", "Bus": "Ethernet + CANopen"}, 520, "auto"),
    (2, 1, "TM241C40R", "Automate Modicon M241, 40 E/S relais", "Contrôleur machine Modicon M241, 40 E/S relais.", "active", {"E/S": "40"}, 640, "auto"),
    (2, 1, "TM262M35MESS8T", "Contrôleur Modicon M262, motion 8 axes", "Contrôleur logique et motion Modicon M262, 8 axes synchronisés, Ethernet industriel.", "active", {"Axes": "8", "Cycle": "3 ns/instruction"}, 1450, "auto"),
    # Modicon M340
    (2, 1, "BMXP3420102", "Processeur Modicon M340 P34 2010", "CPU Modicon M340, 1 port Modbus + 1 port CANopen, 4 Mo.", "active", {"Mémoire": "4 Mo"}, 1650, "auto"),
    (2, 1, "BMXP3420302", "Processeur Modicon M340 P34 2030", "CPU Modicon M340, Ethernet + CANopen, 4 Mo.", "active", {"Mémoire": "4 Mo", "Ethernet": "Oui"}, 2200, "auto"),
    # Modicon Premium (obsolète)
    (2, 1, "TSXP571634M", "Processeur Modicon Premium TSX P57 1634", "CPU Modicon Premium TSX P57. Gamme arrêtée, migration conseillée vers Modicon M580.", "obsolete", None, 1900, "auto"),
    (2, 1, "TSXP572634M", "Processeur Modicon Premium TSX P57 2634", "CPU Modicon Premium TSX P57 2634. Gamme arrêtée, surplus uniquement.", "obsolete", None, 2400, "auto"),
    # TSX Micro (obsolète)
    (2, 1, "TSX3722101", "Automate TSX Micro 3722", "Automate TSX Micro 3722. Gamme arrêtée depuis 2017, remplacement : Modicon M221/M241.", "obsolete", None, 850, "auto"),
    (2, 16, "TSXDMZ28DR", "Module TSX Micro 28 E/S relais", "Module d'extension 28 E/S pour TSX Micro. N'est plus fabriqué.", "obsolete", None, 320, "auto"),
    # Harmony
    (2, 3, "XB5AA21", "Bouton-poussoir Harmony XB5, vert, 1 NO", "Bouton-poussoir affleurant Harmony XB5 Ø22, vert, contact 1 NO, plastique.", "active", None, 14, "auto"),
    (2, 3, "XB5AS8445", "Arrêt d'urgence Harmony XB5, Ø40", "Coup de poing d'arrêt d'urgence Harmony XB5, tête Ø40 rouge, déverrouillage par rotation, 1 NC.", "active", None, 28, "auto"),
    (2, 3, "ZB5AZ009", "Corps de contact Harmony ZB5, 1 NO + 1 NC", "Bloc de contacts pour tête Harmony XB5, 1 NO + 1 NC, fixation 3 trous.", "active", None, 11, "auto"),
    # Zelio
    (2, 1, "SR2B121BD", "Relais intelligent Zelio Logic, 12 E/S, 24 V DC", "Module logique Zelio Logic SR2, 8 entrées / 4 sorties relais, 24 V DC, écran LCD.", "active", {"E/S": "8 E / 4 S"}, 145, "auto"),
    (2, 1, "SR2B201BD", "Relais intelligent Zelio Logic, 20 E/S, 24 V DC", "Module logique Zelio Logic SR2, 12 entrées / 8 sorties relais, 24 V DC.", "active", {"E/S": "12 E / 8 S"}, 195, "auto"),
    # Magelis
    (2, 5, "HMIGTO5310", "Terminal Magelis GTO 10,4\"", "IHM Magelis GTO écran tactile 10,4\" 65k couleurs, Ethernet, USB.", "active", {"Écran": "10,4\" tactile"}, 1450, "auto"),
    (2, 5, "HMIGXU3500", "Terminal Magelis GXU 7\"", "IHM Magelis Easy GXU écran tactile 7\", entrée de gamme, Ethernet.", "active", {"Écran": "7\" tactile"}, 480, "auto"),
    # Alimentations
    (2, 4, "ABLS1A24100", "Alimentation Phaseo ABL S1A 24 V / 10 A", "Alimentation à découpage régulée Phaseo, entrée 100-240 V AC, sortie 24 V DC 10 A, rail DIN.", "active", {"Sortie": "24 V DC / 10 A"}, 165, "auto"),
    (2, 4, "ABL8REM24050", "Alimentation Phaseo ABL8 24 V / 5 A", "Alimentation à découpage régulée Phaseo ABL8, sortie 24 V DC 5 A.", "active", {"Sortie": "24 V DC / 5 A"}, 120, "auto"),
]

# ===================== ROCKWELL AUTOMATION (3) =======================
P += [
    # ControlLogix 5580
    (3, 1, "1756-L81E", "Processeur ControlLogix 5581E", "CPU ControlLogix 5580, 3 Mo de mémoire, port Ethernet/IP 1 Gb intégré.", "active", {"Mémoire": "3 Mo"}, 5600, "auto"),
    (3, 1, "1756-L82E", "Processeur ControlLogix 5582E", "CPU ControlLogix 5580, 5 Mo de mémoire.", "active", {"Mémoire": "5 Mo"}, 6700, "auto"),
    (3, 1, "1756-L83E", "Processeur ControlLogix 5583E", "CPU ControlLogix 5580, 10 Mo de mémoire.", "active", {"Mémoire": "10 Mo"}, 8000, "auto"),
    # ControlLogix 5570 (obsolète)
    (3, 1, "1756-L71", "Processeur ControlLogix 5571", "CPU ControlLogix 5570, 2 Mo. Statut Discontinued, migration vers ControlLogix 5580.", "obsolete", {"Mémoire": "2 Mo"}, 2200, "auto"),
    (3, 1, "1756-L72", "Processeur ControlLogix 5572", "CPU ControlLogix 5570, 4 Mo. Statut Discontinued chez Rockwell.", "obsolete", {"Mémoire": "4 Mo"}, 2900, "auto"),
    (3, 1, "1756-L73", "Processeur ControlLogix 5573", "CPU ControlLogix 5570, 8 Mo. Statut Discontinued chez Rockwell.", "obsolete", {"Mémoire": "8 Mo"}, 3600, "auto"),
    (3, 1, "1756-L61", "Processeur ControlLogix 5561", "CPU ControlLogix série 1756, 2 Mo. Discontinued, migration conseillée vers ControlLogix 5580.", "obsolete", {"Mémoire": "2 Mo"}, 1800, "auto"),
    # ControlLogix I/O
    (3, 16, "1756-IF16", "Module ControlLogix 16 entrées analogiques", "Module d'entrées analogiques 1756-IF16, 16 voies, courant/tension.", "active", {"Voies": "16"}, 1050, "auto"),
    (3, 16, "1756-OF8", "Module ControlLogix 8 sorties analogiques", "Module de sorties analogiques 1756-OF8, 8 voies.", "active", {"Voies": "8"}, 980, "auto"),
    (3, 16, "1756-IB32", "Module ControlLogix 32 entrées TOR 24 V", "Module d'entrées TOR 1756-IB32, 32 points 24 V DC.", "active", {"Points": "32"}, 620, "auto"),
    (3, 16, "1756-OB32", "Module ControlLogix 32 sorties TOR 24 V", "Module de sorties TOR 1756-OB32, 32 points 24 V DC.", "active", {"Points": "32"}, 680, "auto"),
    (3, 16, "1756-EN2T", "Module ControlLogix EtherNet/IP", "Module de communication EtherNet/IP 1756-EN2T pour châssis ControlLogix.", "active", None, 1900, "auto"),
    # CompactLogix
    (3, 1, "1769-L30ER", "Contrôleur CompactLogix 5370 L30ER", "CPU CompactLogix 5370, 1 Mo, 2 ports EtherNet/IP, 8 E/S locales extensibles.", "active", {"Mémoire": "1 Mo"}, 2300, "auto"),
    (3, 1, "1769-L33ER", "Contrôleur CompactLogix 5370 L33ER", "CPU CompactLogix 5370, 2 Mo, 2 ports EtherNet/IP.", "active", {"Mémoire": "2 Mo"}, 3100, "auto"),
    (3, 1, "1769-L36ERM", "Contrôleur CompactLogix 5370 L36ERM", "CPU CompactLogix 5370 avec motion intégré, 3 Mo, 16 axes CIP Motion.", "active", {"Mémoire": "3 Mo", "Axes": "16"}, 4200, "auto"),
    # PowerFlex 525
    (3, 2, "25B-D4P0N104", "Variateur PowerFlex 525 1,5 kW", "Variateur de fréquence PowerFlex 525, 1,5 kW (2 HP) 480 V, EtherNet/IP intégré, safe torque off.", "active", {"Puissance": "1,5 kW", "Tension": "480 V"}, 560, "auto"),
    (3, 2, "25B-D010N104", "Variateur PowerFlex 525 4 kW", "Variateur de fréquence PowerFlex 525, 4 kW (5 HP) 480 V.", "active", {"Puissance": "4 kW"}, 680, "auto"),
    (3, 2, "25B-D017N104", "Variateur PowerFlex 525 7,5 kW", "Variateur de fréquence PowerFlex 525, 7,5 kW (10 HP) 480 V.", "active", {"Puissance": "7,5 kW"}, 820, "auto"),
    # PowerFlex 40 (obsolète)
    (3, 2, "22B-D4P0N104", "Variateur PowerFlex 40 1,5 kW", "Variateur PowerFlex 40, 1,5 kW 480 V. Discontinued, remplacement : PowerFlex 525.", "obsolete", {"Puissance": "1,5 kW"}, 480, "auto"),
    (3, 2, "22B-D010N104", "Variateur PowerFlex 40 4 kW", "Variateur PowerFlex 40, 4 kW 480 V. Discontinued, remplacement : PowerFlex 525.", "obsolete", {"Puissance": "4 kW"}, 590, "auto"),
    # PanelView
    (3, 5, "2711P-T7C4D8", "Terminal PanelView Plus 7 Standard 6,5\"", "IHM tactile PanelView Plus 7 Standard 6,5\" Allen-Bradley, Ethernet, 24 V DC.", "active", {"Écran": "6,5\" tactile"}, 1600, "auto"),
    (3, 5, "2711P-T10C4D8", "Terminal PanelView Plus 7 Standard 10,4\"", "IHM tactile PanelView Plus 7 Standard 10,4\", Ethernet.", "active", {"Écran": "10,4\" tactile"}, 2400, "auto"),
    (3, 5, "2711P-T7C4A8", "Terminal PanelView Plus 6 700", "IHM PanelView Plus 6 700 7\". Discontinued, remplacement : PanelView Plus 7.", "obsolete", {"Écran": "7\" tactile"}, 950, "auto"),
    # MicroLogix
    (3, 1, "1766-L32BXBA", "Automate MicroLogix 1400, 32 E/S", "Automate MicroLogix 1400, 20 entrées / 12 sorties, Ethernet/IP. Fin de vie annoncée, migration Micro870 conseillée.", "active", {"E/S": "32"}, 980, "auto"),
    (3, 1, "1762-L24BXB", "Automate MicroLogix 1200, 24 E/S", "Automate MicroLogix 1200. Discontinued, remplacement : MicroLogix 1400 ou Micro870.", "obsolete", {"E/S": "24"}, 720, "auto"),
    (3, 3, "700-HA33A1", "Relais de contrôle 700-HA, 3 contacts", "Relais tubulaire Allen-Bradley 700-HA, 3 inverseurs 10 A, bobine 110 V AC.", "active", None, 35, "auto"),
]

# ============================== ABB (4) ==============================
P += [
    # ACS580
    (4, 2, "ACS580-01-018A-4", "Variateur ACS580 7,5 kW", "Variateur de fréquence tout usage ACS580, 7,5 kW 400 V, filtre RFI et self intégrés.", "active", {"Puissance": "7,5 kW"}, 980, "auto"),
    (4, 2, "ACS580-01-026A-4", "Variateur ACS580 11 kW", "Variateur de fréquence tout usage ACS580, 11 kW 400 V.", "active", {"Puissance": "11 kW"}, 1200, "auto"),
    (4, 2, "ACS580-01-046A-4", "Variateur ACS580 22 kW", "Variateur de fréquence tout usage ACS580, 22 kW 400 V.", "active", {"Puissance": "22 kW"}, 1750, "auto"),
    (4, 2, "ACS580-01-088A-4", "Variateur ACS580 45 kW", "Variateur de fréquence tout usage ACS580, 45 kW 400 V.", "active", {"Puissance": "45 kW"}, 2900, "auto"),
    # ACS550 (obsolète)
    (4, 2, "ACS550-01-015A-4", "Variateur ACS550 7,5 kW", "Variateur ACS550 7,5 kW 400 V. Gamme remplacée par les ACS580, surplus et reconditionné.", "obsolete", {"Puissance": "7,5 kW"}, 750, "auto"),
    (4, 2, "ACS550-01-038A-4", "Variateur ACS550 18,5 kW", "Variateur ACS550 18,5 kW triphasé 400 V. Gamme remplacée par les ACS580.", "obsolete", {"Puissance": "18,5 kW"}, 1100, "auto"),
    (4, 2, "ACS550-01-072A-4", "Variateur ACS550 37 kW", "Variateur ACS550 37 kW 400 V. Gamme remplacée par les ACS580.", "obsolete", {"Puissance": "37 kW"}, 1600, "auto"),
    # ACS310 (obsolète)
    (4, 2, "ACS310-03E-09A7-4", "Variateur ACS310 4 kW", "Variateur ACS310 4 kW pour pompes et ventilateurs. Gamme arrêtée, remplacement : ACS480/ACS580.", "obsolete", {"Puissance": "4 kW"}, 420, "auto"),
    # ACS880
    (4, 2, "ACS880-01-025A-3", "Variateur industriel ACS880 11 kW", "Variateur industriel ACS880, 11 kW 400 V, contrôle DTC, modules optionnels.", "active", {"Puissance": "11 kW"}, 2400, "auto"),
    (4, 2, "ACS880-01-061A-3", "Variateur industriel ACS880 30 kW", "Variateur industriel ACS880, 30 kW 400 V.", "active", {"Puissance": "30 kW"}, 3800, "auto"),
    # Contacteurs AF
    (4, 3, "AF09-30-10-13", "Contacteur AF09, 9 A, bobine 100-250 V", "Contacteur tripolaire AF09, bobine électronique large plage 100-250 V AC/DC, 1 NO.", "active", {"Calibre": "9 A AC-3"}, 52, "auto"),
    (4, 3, "AF16-30-10-13", "Contacteur AF16, 18 A, bobine 100-250 V", "Contacteur tripolaire AF16, bobine large plage 100-250 V AC/DC, contact auxiliaire 1 NO.", "active", {"Calibre": "18 A AC-3", "Bobine": "100-250 V AC/DC"}, 68, "auto"),
    (4, 3, "AF26-30-00-13", "Contacteur AF26, 26 A, bobine 100-250 V", "Contacteur tripolaire AF26, bobine large plage 100-250 V AC/DC.", "active", {"Calibre": "26 A AC-3"}, 95, "auto"),
    (4, 3, "AF52-30-00-13", "Contacteur AF52, 53 A, bobine 100-250 V", "Contacteur tripolaire AF52.", "active", {"Calibre": "53 A AC-3"}, 185, "auto"),
    (4, 3, "AF65-30-00-13", "Contacteur AF65, 65 A, bobine 100-250 V", "Contacteur tripolaire AF65.", "active", {"Calibre": "65 A AC-3"}, 230, "auto"),
    (4, 3, "A26-30-10-80", "Contacteur A26, 26 A, bobine 220 V AC", "Contacteur tripolaire série A. Gamme arrêtée, remplacement direct : série AF.", "obsolete", {"Calibre": "26 A AC-3"}, 75, "auto"),
    # Alim
    (4, 4, "CP-E 24/10.0", "Alimentation CP-E 24 V / 10 A", "Alimentation à découpage primaire CP-E, sortie 24 V DC 10 A, rail DIN.", "active", {"Sortie": "24 V DC / 10 A"}, 175, "auto"),
]

# ========================== FESTO (5) / SMC (6) ======================
P += [
    (5, 6, "DSBC-32-100-PPVA-N3", "Vérin normalisé DSBC Ø32, course 100 mm", "Vérin pneumatique double effet ISO 15552, amortissement pneumatique réglable.", "active", {"Diamètre": "32 mm", "Course": "100 mm"}, 95, "auto"),
    (5, 6, "DSBC-50-200-PPVA-N3", "Vérin normalisé DSBC Ø50, course 200 mm", "Vérin pneumatique double effet ISO 15552, Ø50, course 200 mm.", "active", {"Diamètre": "50 mm", "Course": "200 mm"}, 145, "auto"),
    (5, 6, "DNC-32-100-PPV-A", "Vérin normalisé DNC Ø32, course 100 mm", "Vérin ISO 15552 ancienne génération. N'est plus fabriqué, remplacement direct : DSBC.", "obsolete", {"Diamètre": "32 mm", "Course": "100 mm"}, 85, "auto"),
    (5, 6, "ADN-25-50-A-P-A", "Vérin compact ADN Ø25, course 50 mm", "Vérin compact ISO 21287 double effet.", "active", {"Diamètre": "25 mm", "Course": "50 mm"}, 65, "auto"),
    (5, 6, "VUVG-L14-M52-MT-G18-1H2L-W1", "Distributeur VUVG 5/2 monostable G1/8", "Électrodistributeur 5/2 monostable VUVG, raccord G1/8, 24 V DC.", "active", None, 78, "auto"),
    (5, 6, "MS6-LFR-1/2-D7-ERV-AS", "Filtre-régulateur MS6-LFR G1/2", "Unité de conditionnement d'air MS6, filtre-régulateur avec purge automatique.", "active", None, 130, "auto"),
    (5, 17, "SIEN-M12B-PS-K-L", "Détecteur inductif SIEN M12, PNP NO", "Capteur de proximité inductif M12, portée 4 mm, PNP NO, câble.", "active", {"Portée": "4 mm"}, 42, "auto"),
    (6, 6, "SY5120-5LZ-01F-Q", "Distributeur SMC SY5000 5/2, 24 V DC", "Électrodistributeur 5/2 monostable série SY5000, raccord instantané, 24 V DC.", "active", None, 72, "auto"),
    (6, 6, "CDQ2B32-25DZ", "Vérin compact SMC CQ2 Ø32, course 25 mm", "Vérin compact double effet série CQ2 avec aimant.", "active", {"Diamètre": "32 mm", "Course": "25 mm"}, 58, "auto"),
    (6, 6, "AW30-F03-A", "Filtre-régulateur SMC AW30 G3/8", "Filtre-régulateur modulaire série AW, raccord G3/8.", "active", None, 62, "auto"),
    (6, 6, "MGPM20-50Z", "Vérin guidé SMC MGP Ø20, course 50 mm", "Vérin à guidage compact série MGP, tiges de guidage intégrées.", "active", {"Diamètre": "20 mm", "Course": "50 mm"}, 125, "auto"),
]

# ============================ KEYSIGHT (7) ===========================
P += [
    (7, 15, "34461A", "Multimètre numérique 34461A, 6,5 digits", "Multimètre de table Truevolt 6,5 digits, remplaçant direct du 34401A, USB/LAN.", "active", {"Résolution": "6,5 digits"}, 1250, "test"),
    (7, 15, "34401A", "Multimètre numérique 34401A, 6,5 digits", "Multimètre de table 6,5 digits HP/Agilent/Keysight. Discontinued en 2016, remplacé par le 34461A.", "obsolete", {"Résolution": "6,5 digits"}, 700, "test"),
    (7, 15, "34465A", "Multimètre numérique 34465A, 6,5 digits", "Multimètre Truevolt 6,5 digits avec numérisation et écran graphique.", "active", {"Résolution": "6,5 digits"}, 1750, "test"),
    (7, 15, "DSOX1204A", "Oscilloscope InfiniiVision DSOX1204A, 70 MHz", "Oscilloscope 4 voies 70 MHz série 1000 X, écran 7\".", "active", {"Bande passante": "70 MHz", "Voies": "4"}, 950, "test"),
    (7, 15, "DSOX2002A", "Oscilloscope InfiniiVision DSO-X 2002A, 70 MHz", "Oscilloscope 2 voies 70 MHz série 2000 X. Discontinued, remplacé par la série 1000 X / 3000 G.", "obsolete", {"Bande passante": "70 MHz", "Voies": "2"}, 750, "test"),
    (7, 15, "DSOX3024G", "Oscilloscope InfiniiVision DSOX3024G, 200 MHz", "Oscilloscope 4 voies 200 MHz série 3000 G X, générateur intégré.", "active", {"Bande passante": "200 MHz", "Voies": "4"}, 4600, "test"),
    (7, 15, "E36311A", "Alimentation de laboratoire E36311A, triple sortie", "Alimentation DC programmable triple sortie 6V/5A et 2x 25V/1A, remplaçante de l'E3631A.", "active", {"Sorties": "3"}, 980, "test"),
    (7, 15, "E3631A", "Alimentation de laboratoire E3631A, triple sortie", "Alimentation DC triple sortie HP/Agilent. Discontinued, remplacée par l'E36311A.", "obsolete", {"Sorties": "3"}, 620, "test"),
    (7, 15, "E36103B", "Alimentation de laboratoire E36103B, 20 V / 2 A", "Alimentation DC programmable compacte 20 V / 2 A, LAN/USB.", "active", {"Sortie": "20 V / 2 A"}, 540, "test"),
    (7, 15, "33522B", "Générateur de fonctions 33522B, 30 MHz, 2 voies", "Générateur de signaux arbitraires Trueform, 30 MHz, 2 voies.", "active", {"Fréquence": "30 MHz", "Voies": "2"}, 3200, "test"),
    (7, 15, "33220A", "Générateur de fonctions 33220A, 20 MHz", "Générateur de fonctions arbitraires 20 MHz. Discontinued, remplacé par la série 33500B.", "obsolete", {"Fréquence": "20 MHz"}, 950, "test"),
    (7, 15, "U1242C", "Multimètre portable U1242C", "Multimètre numérique portable 4 digits, IP67, mesure de température.", "active", None, 320, "test"),
]

# ============================== FLUKE (8) ============================
P += [
    (8, 15, "FLUKE-87-5", "Multimètre Fluke 87V", "Multimètre industriel TRMS référence, précision 0,05 %, CAT IV 600 V.", "active", {"Catégorie": "CAT IV 600 V"}, 480, "test"),
    (8, 15, "FLUKE-179", "Multimètre Fluke 179", "Multimètre TRMS avec température intégrée, CAT IV 600 V.", "active", None, 340, "test"),
    (8, 15, "FLUKE-117", "Multimètre Fluke 117", "Multimètre compact pour électriciens, détection de tension sans contact VoltAlert.", "active", None, 240, "test"),
    (8, 15, "FLUKE-376-FC", "Pince ampèremétrique Fluke 376 FC", "Pince TRMS AC/DC 1000 A avec sonde iFlex et liaison Fluke Connect.", "active", {"Courant": "1000 A AC/DC"}, 520, "test"),
]

# ============================== OMRON (9) ============================
P += [
    (9, 1, "CP1L-EM40DR-D", "Automate CP1L-EM, 40 E/S, Ethernet", "Automate compact CP1L-EM, 24 entrées / 16 sorties relais, port Ethernet, 24 V DC.", "active", {"E/S": "40"}, 480, "auto"),
    (9, 1, "NX1P2-9024DT", "Contrôleur NX1P2, 24 E/S, EtherCAT", "Contrôleur machine NX1P2 avec motion 4 axes, EtherCAT et EtherNet/IP.", "active", {"E/S": "24", "Axes": "4"}, 1100, "auto"),
    (9, 3, "MY2N-GS 24VDC", "Relais MY2N-GS, 2 inverseurs, 24 V DC", "Relais miniature embrochable 2 RT 10 A avec LED, bobine 24 V DC.", "active", None, 9, "auto"),
    (9, 3, "G2R-1-SND 24DC", "Relais G2R-1-SND, 1 inverseur, 24 V DC", "Relais de puissance embrochable 1 RT 10 A, avec LED et diode.", "active", None, 7, "auto"),
    (9, 17, "E3Z-D61", "Détecteur photoélectrique E3Z-D61", "Capteur photoélectrique en réflexion directe, portée 5-100 mm, NPN, câble 2 m.", "active", {"Portée": "100 mm"}, 38, "auto"),
    (9, 17, "E2E-X8MD1-M1", "Détecteur inductif E2E M12, 8 mm", "Capteur de proximité inductif M12, portée 8 mm, DC 2 fils, connecteur M12.", "active", {"Portée": "8 mm"}, 45, "auto"),
]

# ======================== PHOENIX CONTACT (10) =======================
P += [
    (10, 4, "2904601", "Alimentation QUINT4-PS/1AC/24DC/10", "Alimentation rail DIN QUINT POWER 4e génération, 24 V DC / 10 A, SFB Technology.", "active", {"Sortie": "24 V DC / 10 A"}, 210, "auto"),
    (10, 4, "2866763", "Alimentation QUINT-PS/1AC/24DC/10", "Alimentation QUINT POWER 3e génération 24 V / 10 A. N'est plus fabriquée, remplacement : QUINT4 (2904601).", "obsolete", {"Sortie": "24 V DC / 10 A"}, 160, "auto"),
    (10, 4, "2902992", "Alimentation UNO-PS/1AC/24DC/60W", "Alimentation rail DIN UNO POWER 24 V DC / 2,5 A (60 W), compacte.", "active", {"Sortie": "24 V DC / 2,5 A"}, 65, "auto"),
    (10, 4, "2904621", "Alimentation QUINT4-PS/1AC/24DC/20", "Alimentation rail DIN QUINT POWER 24 V DC / 20 A.", "active", {"Sortie": "24 V DC / 20 A"}, 330, "auto"),
    (10, 3, "2967060", "Relais PLC-RSC-24DC/21", "Module relais PLC-INTERFACE, 1 inverseur 6 A, bobine 24 V DC, rail DIN.", "active", None, 12, "auto"),
]

# ============================= CISCO (11) ============================
P += [
    # Catalyst 9300
    (11, 9, "C9300-24T-E", "Commutateur Catalyst 9300, 24 ports 1G", "Commutateur d'accès Catalyst 9300, 24 ports GbE data, Network Essentials.", "active", {"Ports": "24x 1G"}, 2800, "it"),
    (11, 9, "C9300-48T-E", "Commutateur Catalyst 9300, 48 ports 1G", "Commutateur d'accès Catalyst 9300, 48 ports GbE data.", "active", {"Ports": "48x 1G"}, 4300, "it"),
    (11, 9, "C9300-24P-E", "Commutateur Catalyst 9300, 24 ports PoE+", "Commutateur d'accès Catalyst 9300, 24 ports GbE PoE+ (445 W).", "active", {"Ports": "24x 1G PoE+"}, 3300, "it"),
    (11, 9, "C9300-48P-E", "Commutateur Catalyst 9300, 48 ports PoE+", "Commutateur d'accès Catalyst 9300, 48 ports GbE PoE+ (437 W).", "active", {"Ports": "48x 1G PoE+"}, 5100, "it"),
    # Catalyst 3850 (EoS)
    (11, 9, "WS-C3850-24T-S", "Commutateur Catalyst 3850, 24 ports", "Commutateur Catalyst 3850 24 ports GbE IP Base. End of Sale 2020, successeur : Catalyst 9300.", "obsolete", {"Ports": "24x 1G"}, 850, "it"),
    (11, 9, "WS-C3850-48T-S", "Commutateur Catalyst 3850, 48 ports", "Commutateur Catalyst 3850 48 ports GbE IP Base. End of Sale 2020, successeur : Catalyst 9300.", "obsolete", {"Ports": "48x 1G"}, 1150, "it"),
    (11, 9, "WS-C3850-24P-S", "Commutateur Catalyst 3850, 24 ports PoE+", "Commutateur Catalyst 3850 24 ports PoE+. End of Sale 2020.", "obsolete", {"Ports": "24x 1G PoE+"}, 950, "it"),
    # Catalyst 3750-X / 2960-X (EoS)
    (11, 9, "WS-C3750X-24T-S", "Commutateur Catalyst 3750-X, 24 ports", "Commutateur empilable Catalyst 3750-X. End of Support 2021, occasion uniquement.", "obsolete", {"Ports": "24x 1G"}, 320, "it"),
    (11, 9, "WS-C3750X-48T-S", "Commutateur Catalyst 3750-X, 48 ports", "Commutateur empilable Catalyst 3750-X 48 ports. End of Support 2021.", "obsolete", {"Ports": "48x 1G"}, 420, "it"),
    (11, 9, "WS-C2960X-24TS-L", "Commutateur Catalyst 2960-X, 24 ports", "Commutateur d'accès Catalyst 2960-X, 24 GbE + 4 SFP, LAN Base. End of Sale, successeur : Catalyst 9200.", "obsolete", {"Ports": "24x 1G + 4 SFP"}, 380, "it"),
    (11, 9, "WS-C2960X-48TS-L", "Commutateur Catalyst 2960-X, 48 ports", "Commutateur d'accès Catalyst 2960-X, 48 GbE + 4 SFP. End of Sale.", "obsolete", {"Ports": "48x 1G + 4 SFP"}, 520, "it"),
    # Catalyst 9200
    (11, 9, "C9200L-24T-4G-E", "Commutateur Catalyst 9200L, 24 ports", "Commutateur d'accès Catalyst 9200L, 24 GbE + 4 SFP, successeur du 2960-X.", "active", {"Ports": "24x 1G + 4 SFP"}, 1500, "it"),
    (11, 9, "C9200L-48T-4G-E", "Commutateur Catalyst 9200L, 48 ports", "Commutateur d'accès Catalyst 9200L, 48 GbE + 4 SFP.", "active", {"Ports": "48x 1G + 4 SFP"}, 2300, "it"),
    # Routeurs ISR
    (11, 10, "ISR4321/K9", "Routeur ISR 4321", "Routeur de branche ISR 4321, 2 ports WAN GbE, 50-100 Mb/s.", "active", {"Débit": "50-100 Mb/s"}, 1200, "it"),
    (11, 10, "ISR4331/K9", "Routeur ISR 4331", "Routeur de branche ISR 4331, 3 ports WAN, 100-300 Mb/s.", "active", {"Débit": "100-300 Mb/s"}, 2100, "it"),
    (11, 10, "ISR4351/K9", "Routeur ISR 4351", "Routeur de branche ISR 4351, 3 ports WAN, 200-400 Mb/s.", "active", {"Débit": "200-400 Mb/s"}, 3500, "it"),
    (11, 10, "CISCO2901/K9", "Routeur Cisco 2901", "Routeur ISR G2 2901. End of Support 2022, remplacement : ISR 4321.", "obsolete", None, 280, "it"),
    (11, 10, "CISCO2911/K9", "Routeur Cisco 2911", "Routeur ISR G2 2911. End of Support 2022, remplacement : ISR 4331.", "obsolete", None, 380, "it"),
    (11, 10, "ASR1001-X", "Routeur ASR 1001-X", "Routeur d'agrégation ASR 1001-X, 2,5 à 20 Gb/s, 6 ports SFP + 2 SFP+.", "active", {"Débit": "2,5-20 Gb/s"}, 5500, "it"),
    # PSU
    (11, 7, "PWR-C1-715WAC", "Alimentation 715 W AC Catalyst 3850/9300", "Bloc d'alimentation 715 W AC. Annoncé EoS, successeur : PWR-C1-715WAC-P.", "obsolete", {"Puissance": "715 W"}, 180, "it"),
    (11, 7, "PWR-C1-715WAC-P", "Alimentation 715 W AC platine Catalyst 9300", "Bloc d'alimentation 715 W AC haut rendement (platinum), remplace PWR-C1-715WAC.", "active", {"Puissance": "715 W"}, 320, "it"),
    (11, 7, "PWR-C1-350WAC-P", "Alimentation 350 W AC platine Catalyst 9300", "Bloc d'alimentation 350 W AC platinum pour Catalyst 9300.", "active", {"Puissance": "350 W"}, 240, "it"),
    (11, 7, "PWR-C2-250WAC", "Alimentation 250 W AC Catalyst 3650", "Bloc d'alimentation 250 W AC pour Catalyst 3650. EoS avec la gamme 3650.", "obsolete", {"Puissance": "250 W"}, 120, "it"),
    # SFP
    (11, 8, "GLC-SX-MMD", "Module SFP 1000BASE-SX multimode", "Émetteur-récepteur optique SFP 1 Gb/s multimode 850 nm avec DOM.", "active", {"Débit": "1 Gb/s", "Portée": "550 m"}, 35, "it"),
    (11, 8, "GLC-LH-SMD", "Module SFP 1000BASE-LX/LH monomode", "Émetteur-récepteur optique SFP 1 Gb/s monomode 1310 nm, 10 km, avec DOM.", "active", {"Débit": "1 Gb/s", "Portée": "10 km"}, 48, "it"),
    (11, 8, "SFP-10G-SR", "Module SFP+ 10GBASE-SR multimode", "Émetteur-récepteur SFP+ 10 Gb/s multimode 850 nm, 300 m sur OM3.", "active", {"Débit": "10 Gb/s", "Portée": "300 m"}, 65, "it"),
    (11, 8, "SFP-10G-LR", "Module SFP+ 10GBASE-LR monomode", "Émetteur-récepteur SFP+ 10 Gb/s monomode 1310 nm, 10 km.", "active", {"Débit": "10 Gb/s", "Portée": "10 km"}, 95, "it"),
    (11, 8, "SFP-25G-SR-S", "Module SFP28 25GBASE-SR", "Émetteur-récepteur SFP28 25 Gb/s multimode.", "active", {"Débit": "25 Gb/s"}, 140, "it"),
    (11, 8, "QSFP-40G-SR4", "Module QSFP+ 40GBASE-SR4", "Émetteur-récepteur QSFP+ 40 Gb/s multimode MPO.", "active", {"Débit": "40 Gb/s"}, 190, "it"),
    (11, 8, "QSFP-100G-SR4-S", "Module QSFP28 100GBASE-SR4", "Émetteur-récepteur QSFP28 100 Gb/s multimode MPO-12.", "active", {"Débit": "100 Gb/s"}, 450, "it"),
    # Modules
    (11, 13, "C9300-NM-8X", "Module réseau 8 ports 10G Catalyst 9300", "Module d'extension réseau 8 ports SFP+ 10 Gb/s pour commutateurs Catalyst 9300.", "active", {"Ports": "8x SFP+"}, 800, "it"),
    (11, 13, "C9300-NM-4G", "Module réseau 4 ports 1G Catalyst 9300", "Module d'extension réseau 4 ports SFP 1 Gb/s pour Catalyst 9300.", "active", {"Ports": "4x SFP"}, 420, "it"),
    (11, 13, "MEM-4300-8G", "Mémoire 8 Go ISR 4300", "Barrette mémoire DRAM 8 Go pour routeurs ISR 4300.", "active", {"Capacité": "8 Go"}, 240, "it"),
]

# =========================== JUNIPER (12) ============================
P += [
    (12, 9, "EX2300-24T", "Commutateur EX2300, 24 ports", "Commutateur d'accès EX2300, 24 GbE + 4 SFP/SFP+, successeur de l'EX2200.", "active", {"Ports": "24x 1G + 4 SFP+"}, 1100, "it"),
    (12, 9, "EX2300-48T", "Commutateur EX2300, 48 ports", "Commutateur d'accès EX2300, 48 GbE + 4 SFP/SFP+.", "active", {"Ports": "48x 1G + 4 SFP+"}, 1700, "it"),
    (12, 9, "EX3400-24T", "Commutateur EX3400, 24 ports", "Commutateur d'accès EX3400, 24 GbE + 4 SFP+ + 2 QSFP+, Virtual Chassis.", "active", {"Ports": "24x 1G + 4 SFP+"}, 1900, "it"),
    (12, 9, "EX2200-24T-4G", "Commutateur EX2200, 24 ports", "Commutateur EX2200 24 GbE + 4 SFP. End of Sale 2017, successeur : EX2300.", "obsolete", {"Ports": "24x 1G + 4 SFP"}, 220, "it"),
    (12, 9, "EX2200-48T-4G", "Commutateur EX2200, 48 ports", "Commutateur EX2200 48 GbE + 4 SFP. End of Sale 2017, successeur : EX2300.", "obsolete", {"Ports": "48x 1G + 4 SFP"}, 300, "it"),
    (12, 10, "SRX300", "Pare-feu SRX300", "Passerelle de services SRX300 pour agence, 8 ports GbE, 1 Gb/s firewall.", "active", {"Débit": "1 Gb/s"}, 550, "it"),
    (12, 10, "SRX320", "Pare-feu SRX320", "Passerelle de services SRX320, 8 ports dont 2 SFP, 1 Gb/s firewall.", "active", {"Débit": "1 Gb/s"}, 750, "it"),
    (12, 10, "SRX550M", "Pare-feu SRX550M", "Passerelle de services SRX550 Medium, modulaire, 5,5 Gb/s firewall.", "active", {"Débit": "5,5 Gb/s"}, 2800, "it"),
    (12, 8, "EX-SFP-1GE-SX", "Module SFP 1G SX Juniper", "Émetteur-récepteur SFP 1 Gb/s multimode 850 nm pour gammes EX/SRX.", "active", {"Débit": "1 Gb/s"}, 45, "it"),
    (12, 8, "EX-SFP-10GE-SR", "Module SFP+ 10G SR Juniper", "Émetteur-récepteur SFP+ 10 Gb/s multimode pour gammes EX/QFX.", "active", {"Débit": "10 Gb/s"}, 85, "it"),
    (12, 8, "EX-SFP-10GE-LR", "Module SFP+ 10G LR Juniper", "Émetteur-récepteur SFP+ 10 Gb/s monomode 10 km.", "active", {"Débit": "10 Gb/s", "Portée": "10 km"}, 120, "it"),
]

# ============================== DELL (13) ============================
P += [
    (13, 7, "450-AEBN", "Alimentation 750 W PowerEdge R630/R730", "Bloc d'alimentation redondant 750 W pour PowerEdge 13G (R630/R730/T430). N'est plus produit.", "obsolete", {"Puissance": "750 W"}, 110, "it"),
    (13, 7, "450-AFJN", "Alimentation 750 W PowerEdge 13G", "Bloc d'alimentation redondant 750 W titanium pour PowerEdge R430/R530/R630/R730.", "active", {"Puissance": "750 W"}, 160, "it"),
    (13, 7, "450-AHLH", "Alimentation 1100 W PowerEdge", "Bloc d'alimentation redondant 1100 W pour PowerEdge R730/R730xd.", "active", {"Puissance": "1100 W"}, 280, "it"),
    (13, 7, "0TXYM1", "Alimentation 550 W PowerEdge R430", "Bloc d'alimentation 550 W (FRU 0TXYM1) pour PowerEdge R430.", "active", {"Puissance": "550 W"}, 130, "it"),
    (13, 11, "0X8DXD", "Contrôleur RAID PERC H730P Mini 2 Go", "Carte RAID PERC H730P mini mono 2 Go cache pour PowerEdge R630/R730. Génération remplacée par les PERC 11.", "obsolete", {"Cache": "2 Go"}, 140, "it"),
    (13, 11, "405-AAER", "Contrôleur RAID PERC H740P 8 Go", "Carte RAID PERC H740P adapter, 8 Go cache NV, pour PowerEdge 14G.", "active", {"Cache": "8 Go"}, 380, "it"),
    (13, 11, "405-AADW", "Contrôleur RAID PERC H730P Adapter 2 Go", "Carte RAID PERC H730P adapter 2 Go. Génération 13G, n'est plus produite.", "obsolete", {"Cache": "2 Go"}, 170, "it"),
    (13, 11, "405-ABBD", "Contrôleur RAID PERC H750 8 Go", "Carte RAID PERC H750 adapter, 8 Go cache, pour PowerEdge 15G.", "active", {"Cache": "8 Go"}, 450, "it"),
    (13, 12, "400-BCNR", "SSD 480 Go SATA 2,5\" PowerEdge", "SSD 480 Go SATA 6G Read Intensive hot-plug pour PowerEdge.", "active", {"Capacité": "480 Go"}, 210, "it"),
    (13, 12, "400-BCNT", "SSD 960 Go SATA 2,5\" PowerEdge", "SSD 960 Go SATA 6G Read Intensive hot-plug pour PowerEdge.", "active", {"Capacité": "960 Go"}, 320, "it"),
    (13, 12, "400-ATJL", "Disque 1,2 To SAS 10K 2,5\" PowerEdge", "Disque dur 1,2 To SAS 12G 10 000 tr/min hot-plug.", "active", {"Capacité": "1,2 To"}, 260, "it"),
    (13, 12, "400-AJPD", "Disque 1,2 To SAS 10K 13G", "Disque dur 1,2 To SAS 10K pour PowerEdge 13G. Référence remplacée par 400-ATJL.", "obsolete", {"Capacité": "1,2 To"}, 190, "it"),
    (13, 13, "405-AADY", "Carte HBA330 Mini", "Carte contrôleur HBA330 mini mono (mode IT, sans RAID) pour PowerEdge 13G/14G.", "active", None, 160, "it"),
    (13, 13, "540-BBVL", "Carte réseau Intel X710 4x10G SFP+", "Carte réseau quad port 10 GbE SFP+ Intel X710 rNDC pour PowerEdge.", "active", {"Ports": "4x 10G SFP+"}, 350, "it"),
    (13, 14, "451-BBZG", "Batterie 4 cellules Latitude 68 Wh", "Batterie principale 4 cellules 68 Wh pour Dell Latitude 5570/Precision 3510.", "active", {"Capacité": "68 Wh"}, 95, "it"),
]

# ============================== HPE (14) =============================
P += [
    (14, 7, "511778-001", "Alimentation 460 W ProLiant G6/G7", "Bloc d'alimentation 460 W common slot pour ProLiant DL360/DL380 G6-G7. Spare HPE, plus produit.", "obsolete", {"Puissance": "460 W"}, 70, "it"),
    (14, 7, "720478-B21", "Alimentation 500 W ProLiant Gen9", "Bloc d'alimentation flex slot platinum 500 W pour ProLiant DL360/DL380 Gen9.", "active", {"Puissance": "500 W"}, 160, "it"),
    (14, 7, "865408-B21", "Alimentation 500 W ProLiant Gen10", "Bloc d'alimentation flex slot platinum 500 W pour ProLiant Gen10.", "active", {"Puissance": "500 W"}, 200, "it"),
    (14, 7, "865414-B21", "Alimentation 800 W ProLiant Gen10", "Bloc d'alimentation flex slot platinum 800 W pour ProLiant Gen10.", "active", {"Puissance": "800 W"}, 260, "it"),
    (14, 7, "830272-B21", "Alimentation 1600 W ProLiant Gen10", "Bloc d'alimentation flex slot platinum 1600 W pour ProLiant Gen10.", "active", {"Puissance": "1600 W"}, 420, "it"),
    (14, 11, "804395-B21", "Contrôleur Smart Array E208i-a Gen10", "Carte contrôleur Smart Array E208i-a SR Gen10, 8 voies SAS internes.", "active", None, 280, "it"),
    (14, 11, "836260-001", "Contrôleur Smart Array P408i-a Gen10 2 Go", "Carte Smart Array P408i-a SR Gen10 avec 2 Go cache (spare 836260-001).", "active", {"Cache": "2 Go"}, 420, "it"),
    (14, 11, "726736-B21", "Contrôleur Smart Array P440ar 2 Go", "Carte Smart Array P440ar 2 Go FBWC pour Gen9. N'est plus produite, remplacée par les Smart Array Gen10.", "obsolete", {"Cache": "2 Go"}, 180, "it"),
    (14, 11, "631670-B21", "Contrôleur Smart Array P420 1 Go", "Carte Smart Array P420 1 Go FBWC pour Gen8. Obsolète.", "obsolete", {"Cache": "1 Go"}, 90, "it"),
    (14, 12, "P18434-B21", "SSD 960 Go SATA Read Intensive Gen10", "SSD 960 Go SATA 6G 2,5\" hot-plug Multi Vendor pour ProLiant Gen10.", "active", {"Capacité": "960 Go"}, 340, "it"),
    (14, 12, "P18436-B21", "SSD 1,92 To SATA Read Intensive Gen10", "SSD 1,92 To SATA 6G 2,5\" hot-plug Multi Vendor.", "active", {"Capacité": "1,92 To"}, 560, "it"),
    (14, 12, "872479-B21", "Disque 1,2 To SAS 10K SFF Gen10", "Disque dur 1,2 To SAS 12G 10K 2,5\" hot-plug pour ProLiant Gen10.", "active", {"Capacité": "1,2 To"}, 280, "it"),
    (14, 12, "507127-B21", "Disque 300 Go SAS 10K G6/G7", "Disque dur 300 Go SAS 6G 10K 2,5\" pour ProLiant G6/G7. Plus produit, surplus uniquement.", "obsolete", {"Capacité": "300 Go"}, 60, "it"),
    (14, 13, "817753-B21", "Carte réseau 10/25 GbE 2 ports 640SFP28", "Adaptateur Ethernet 10/25 GbE double port Mellanox 640SFP28 pour ProLiant Gen10.", "active", {"Ports": "2x 25G"}, 380, "it"),
    (14, 13, "665249-B21", "Carte réseau 10 GbE 2 ports 560SFP+", "Adaptateur Ethernet 10 GbE double port 560SFP+ (Intel 82599). Ancienne génération.", "obsolete", {"Ports": "2x 10G"}, 120, "it"),
    (14, 13, "P00924-B21", "Mémoire 32 Go DDR4-2933 ECC", "Barrette mémoire HPE SmartMemory 32 Go dual rank DDR4-2933 pour Gen10.", "active", {"Capacité": "32 Go"}, 320, "it"),
]

# ============================ LENOVO (15) ============================
P += [
    (15, 7, "7N67A00883", "Alimentation 750 W ThinkSystem", "Bloc d'alimentation platinum hot-swap 750 W pour ThinkSystem SR630/SR650.", "active", {"Puissance": "750 W"}, 230, "it"),
    (15, 7, "7N67A00885", "Alimentation 1100 W ThinkSystem", "Bloc d'alimentation platinum hot-swap 1100 W pour ThinkSystem.", "active", {"Puissance": "1100 W"}, 320, "it"),
    (15, 14, "01AV430", "Batterie interne ThinkPad X1 Carbon Gen 5/6", "Batterie Li-Po 57 Wh (FRU) pour ThinkPad X1 Carbon 5e et 6e génération.", "active", {"Capacité": "57 Wh"}, 85, "it"),
    (15, 14, "00HW028", "Batterie interne ThinkPad X1 Carbon Gen 4", "Batterie Li-Po 52 Wh (FRU) pour ThinkPad X1 Carbon 4e génération. N'est plus produite.", "obsolete", {"Capacité": "52 Wh"}, 70, "it"),
    (15, 14, "00HW022", "Batterie interne ThinkPad X1 Carbon Gen 3", "Batterie Li-Po 50 Wh (FRU) pour X1 Carbon 3e génération. N'est plus produite.", "obsolete", {"Capacité": "50 Wh"}, 65, "it"),
    (15, 14, "01AV489", "Batterie ThinkPad T470/T480 61 Wh", "Batterie interne 61 Wh (FRU 01AV489) pour ThinkPad T470/T480/T570.", "active", {"Capacité": "61 Wh"}, 90, "it"),
    (15, 14, "45N1023", "Batterie ThinkPad T430/T530 9 cellules", "Batterie 9 cellules 94 Wh pour ThinkPad T430/T530/W530. Plus produite.", "obsolete", {"Capacité": "94 Wh"}, 55, "it"),
    (15, 12, "4XB7A17074", "SSD 960 Go SATA ThinkSystem", "SSD 960 Go SATA 6G 2,5\" hot-swap entry pour ThinkSystem.", "active", {"Capacité": "960 Go"}, 300, "it"),
    (15, 12, "4XB7A17076", "SSD 1,92 To SATA ThinkSystem", "SSD 1,92 To SATA 6G 2,5\" hot-swap pour ThinkSystem.", "active", {"Capacité": "1,92 To"}, 520, "it"),
    (15, 12, "7XB7A00027", "Disque 1,2 To SAS 10K ThinkSystem", "Disque dur 1,2 To SAS 12G 10K 2,5\" hot-swap pour ThinkSystem.", "active", {"Capacité": "1,2 To"}, 270, "it"),
    (15, 11, "4Y37A09722", "Contrôleur RAID 930-8i 2 Go ThinkSystem", "Carte RAID 930-8i, 2 Go flash, PCIe, pour ThinkSystem.", "active", {"Cache": "2 Go"}, 480, "it"),
    (15, 11, "4Y37A72483", "Contrôleur RAID 940-8i 4 Go ThinkSystem", "Carte RAID 940-8i, 4 Go flash, pour ThinkSystem V2.", "active", {"Cache": "4 Go"}, 620, "it"),
    (15, 13, "4X70M60574", "Mémoire 16 Go DDR4-2400 SODIMM", "Barrette mémoire 16 Go DDR4-2400 SODIMM pour ThinkPad.", "active", {"Capacité": "16 Go"}, 120, "it"),
    (15, 13, "01AG790", "Écran 14\" FHD ThinkPad T480s", "Dalle LCD 14\" FHD IPS antireflet (FRU) pour ThinkPad T480s.", "active", None, 140, "it"),
]

# ------------------------------------------------------------ supersessions
# (old_ref, new_ref, note) — résolu par référence (les refs sont uniques ici)
SUPERSESSIONS = [
    ("6ES7214-1AG31-0XB0", "6ES7214-1AG40-0XB0", "Phase-out génération 3, remplacement direct par la génération 4."),
    ("6ES7313-1AD03-0AB0", "6ES7511-1AK02-0AB0", "Migration S7-300 vers S7-1500 recommandée par Siemens (TIA Portal)."),
    ("6ES7315-2AH14-0AB0", "6ES7513-1AL02-0AB0", "Migration S7-300 vers S7-1500 recommandée par Siemens."),
    ("6ES7317-2AK14-0AB0", "6ES7516-3AN02-0AB0", "Migration S7-300 vers S7-1500 recommandée par Siemens."),
    ("6SE6440-2UD13-7AA1", "6SL3210-1KE11-8UF1", "Successeur conseillé par Siemens : SINAMICS G120C."),
    ("6SE6440-2UD21-5AA1", "6SL3210-1KE21-3UF1", "Successeur conseillé par Siemens : SINAMICS G120C."),
    ("6SE6440-2UD22-2BA1", "6SL3210-1KE21-3UF1", "Successeur conseillé par Siemens : SINAMICS G120C."),
    ("6SE6440-2UD25-5CA1", "6SL3210-1KE21-3UF1", "Successeur conseillé par Siemens : SINAMICS G120C."),
    ("6SL3211-0AB12-5UA1", "6SL3210-5BB21-1UV1", "Gamme G110 remplacée par SINAMICS V20."),
    ("6SL3211-0AB15-5BA1", "6SL3210-5BB21-1UV1", "Gamme G110 remplacée par SINAMICS V20."),
    ("6AV6648-0CC11-3AX0", "6AV2123-2GB03-0AX0", "KTP600 Basic remplacé par KTP700 Basic."),
    ("6AV6545-0BC15-2AX0", "6AV2124-0MC01-0AX0", "Gamme 170 remplacée par les pupitres Comfort."),
    ("6EP1931-2DC42", "6EP1961-2BA21", "DC-UPS remplacé par la gamme SITOP UPS1600."),
    ("ATV312H018M2", "ATV320U04N4B", "Remplacement officiel Schneider : Altivar Machine ATV320."),
    ("ATV312HU15N4", "ATV320U15N4B", "Remplacement officiel Schneider : Altivar Machine ATV320."),
    ("ATV312HU40N4", "ATV320U40N4B", "Remplacement officiel Schneider : Altivar Machine ATV320."),
    ("ATV312HD11N4", "ATV320D11N4B", "Remplacement officiel Schneider : Altivar Machine ATV320."),
    ("ATV21HU22N4", "ATV320U15N4B", "Gamme ATV21 arrêtée, migration vers ATV320."),
    ("TSXP571634M", "BMXP3420102", "Migration Modicon Premium vers M340/M580."),
    ("TSXP572634M", "BMXP3420302", "Migration Modicon Premium vers M340/M580."),
    ("TSX3722101", "TM221CE24R", "Migration TSX Micro vers Modicon M221."),
    ("TSXDMZ28DR", "TM221C40R", "Migration TSX Micro vers Modicon M221."),
    ("1756-L71", "1756-L81E", "Migration ControlLogix 5570 vers 5580 conseillée par Rockwell."),
    ("1756-L72", "1756-L82E", "Migration ControlLogix 5570 vers 5580 conseillée par Rockwell."),
    ("1756-L73", "1756-L83E", "Migration ControlLogix 5570 vers 5580 conseillée par Rockwell."),
    ("1756-L61", "1756-L81E", "Migration ControlLogix 5560 vers 5580 conseillée par Rockwell."),
    ("22B-D4P0N104", "25B-D4P0N104", "PowerFlex 40 remplacé par PowerFlex 525."),
    ("22B-D010N104", "25B-D010N104", "PowerFlex 40 remplacé par PowerFlex 525."),
    ("2711P-T7C4A8", "2711P-T7C4D8", "PanelView Plus 6 remplacé par PanelView Plus 7."),
    ("1762-L24BXB", "1766-L32BXBA", "MicroLogix 1200 remplacé par MicroLogix 1400."),
    ("ACS550-01-015A-4", "ACS580-01-018A-4", "Gamme ACS550 remplacée par ACS580."),
    ("ACS550-01-038A-4", "ACS580-01-046A-4", "Gamme ACS550 remplacée par ACS580."),
    ("ACS550-01-072A-4", "ACS580-01-088A-4", "Gamme ACS550 remplacée par ACS580."),
    ("ACS310-03E-09A7-4", "ACS580-01-018A-4", "Gamme ACS310 arrêtée, migration ACS480/ACS580."),
    ("A26-30-10-80", "AF26-30-00-13", "Série A remplacée par la série AF."),
    ("DNC-32-100-PPV-A", "DSBC-32-100-PPVA-N3", "Gamme DNC remplacée par DSBC (ISO 15552)."),
    ("34401A", "34461A", "Remplacement officiel Keysight : multimètre Truevolt 34461A."),
    ("DSOX2002A", "DSOX1204A", "Série 2000 X remplacée par les séries 1000 X / 3000 G."),
    ("E3631A", "E36311A", "Remplacement officiel Keysight : E36311A."),
    ("33220A", "33522B", "Remplacement officiel Keysight : génération Trueform 33500B."),
    ("2866763", "2904601", "QUINT 3e génération remplacée par QUINT4."),
    ("WS-C3850-24T-S", "C9300-24T-E", "End of Sale, migration Catalyst 9300 recommandée par Cisco."),
    ("WS-C3850-48T-S", "C9300-48T-E", "End of Sale, migration Catalyst 9300 recommandée par Cisco."),
    ("WS-C3850-24P-S", "C9300-24P-E", "End of Sale, migration Catalyst 9300 recommandée par Cisco."),
    ("WS-C3750X-24T-S", "WS-C3850-24T-S", "Chaîne de remplacement : 3750-X vers 3850 (lui-même remplacé par 9300)."),
    ("WS-C3750X-48T-S", "WS-C3850-48T-S", "Chaîne de remplacement : 3750-X vers 3850."),
    ("WS-C2960X-24TS-L", "C9200L-24T-4G-E", "End of Sale, migration Catalyst 9200 recommandée par Cisco."),
    ("WS-C2960X-48TS-L", "C9200L-48T-4G-E", "End of Sale, migration Catalyst 9200 recommandée par Cisco."),
    ("CISCO2901/K9", "ISR4321/K9", "End of Support, migration ISR 4000 recommandée par Cisco."),
    ("CISCO2911/K9", "ISR4331/K9", "End of Support, migration ISR 4000 recommandée par Cisco."),
    ("PWR-C1-715WAC", "PWR-C1-715WAC-P", "Version platinum recommandée par Cisco."),
    ("EX2200-24T-4G", "EX2300-24T", "End of Sale, successeur officiel : EX2300."),
    ("EX2200-48T-4G", "EX2300-48T", "End of Sale, successeur officiel : EX2300."),
    ("450-AEBN", "450-AFJN", "Référence remplacée dans le catalogue Dell."),
    ("0X8DXD", "405-AAER", "PERC H730P remplacé par PERC H740P (14G)."),
    ("405-AADW", "405-AAER", "PERC H730P adapter remplacé par PERC H740P."),
    ("400-AJPD", "400-ATJL", "Référence disque remplacée au catalogue Dell."),
    ("511778-001", "720478-B21", "Génération G6/G7 remplacée par les PSU flex slot Gen9."),
    ("726736-B21", "836260-001", "Smart Array P440ar remplacé par P408i-a Gen10."),
    ("631670-B21", "726736-B21", "Smart Array P420 remplacé par P440ar (lui-même remplacé en Gen10)."),
    ("507127-B21", "872479-B21", "Référence disque G6/G7 remplacée au catalogue HPE."),
    ("665249-B21", "817753-B21", "Adaptateur 560SFP+ remplacé par le 640SFP28."),
    ("00HW028", "01AV430", "FRU remplacée pour les générations suivantes du X1 Carbon."),
    ("00HW022", "00HW028", "Chaîne de remplacement FRU X1 Carbon Gen 3 vers Gen 4."),
]

# --------------------------------------------------------- part_references
# (owner_ref, alt_reference, type, brand, source)
REFERENCES = [
    ("6ES7214-1AG40-0XB0", "6ES7 214-1AG40-0XB0", "oem", "Siemens", "format-catalogue"),
    ("6ES7315-2AH14-0AB0", "6ES7 315-2AH14-0AB0", "oem", "Siemens", "format-catalogue"),
    ("6EP1334-2BA20", "6EP1 334-2BA20", "oem", "Siemens", "format-catalogue"),
    ("6SL3210-1KE21-3UF1", "6SL3 210-1KE21-3UF1", "oem", "Siemens", "format-catalogue"),
    ("6AV2123-2GB03-0AX0", "6AV2 123-2GB03-0AX0", "oem", "Siemens", "format-catalogue"),
    ("ATV320U15N4B", "ATV320U15N4W", "oem", "Schneider Electric", "variante-montage-mural"),
    ("ATV320U40N4B", "ATV320U40N4W", "oem", "Schneider Electric", "variante-montage-mural"),
    ("LC1D18M7", "LC1D18M7C", "oem", "Schneider Electric", "variante-marche-asie"),
    ("LC1D09M7", "LC1D09M7C", "oem", "Schneider Electric", "variante-marche-asie"),
    ("TM221CE24R", "TM221CE24R1", "oem", "Schneider Electric", "variante-firmware"),
    ("1756-L81E", "1756-L81E/B", "oem", "Rockwell Automation", "revision-serie-B"),
    ("1756-L71", "1756-L71/B", "oem", "Rockwell Automation", "revision-serie-B"),
    ("25B-D4P0N104", "25B-D4P0N114", "oem", "Rockwell Automation", "variante-filtre-CEM"),
    ("2711P-T7C4D8", "2711P-T7C4D8K", "oem", "Rockwell Automation", "variante-conformal-coating"),
    ("ACS580-01-026A-4", "ACS580-01-026A-4+B056", "oem", "ABB", "variante-option-IP55"),
    ("ACS550-01-038A-4", "ACS550-01-038A-4+B055", "oem", "ABB", "variante-option"),
    ("AF16-30-10-13", "1SBL177001R1310", "oem", "ABB", "code-commande-usine"),
    ("AF09-30-10-13", "1SBL137001R1310", "oem", "ABB", "code-commande-usine"),
    ("AF26-30-00-13", "1SBL237001R1300", "oem", "ABB", "code-commande-usine"),
    ("CP-E 24/10.0", "1SVR427035R0000", "oem", "ABB", "code-commande-usine"),
    ("DSBC-32-100-PPVA-N3", "1376658", "oem", "Festo", "code-article"),
    ("DNC-32-100-PPV-A", "163310", "oem", "Festo", "code-article"),
    ("34461A", "34461A-DMM", "oem", "Keysight", "code-bundle"),
    ("34401A", "HP 34401A", "oem", "Agilent / HP", "ancienne-marque"),
    ("E3631A", "HP E3631A", "oem", "Agilent / HP", "ancienne-marque"),
    ("FLUKE-87-5", "FLUKE 87-V", "oem", "Fluke", "format-catalogue"),
    ("2904601", "QUINT4-PS/1AC/24DC/10", "oem", "Phoenix Contact", "designation-type"),
    ("2866763", "QUINT-PS/1AC/24DC/10", "oem", "Phoenix Contact", "designation-type"),
    ("2902992", "UNO-PS/1AC/24DC/60W", "oem", "Phoenix Contact", "designation-type"),
    ("GLC-SX-MMD", "GLC-SX-MMD=", "oem", "Cisco", "reference-spare"),
    ("GLC-LH-SMD", "GLC-LH-SMD=", "oem", "Cisco", "reference-spare"),
    ("SFP-10G-SR", "SFP-10G-SR=", "oem", "Cisco", "reference-spare"),
    ("SFP-10G-SR", "10-2415-03", "mpn", "Cisco", "numero-fabrication"),
    ("SFP-10G-LR", "SFP-10G-LR=", "oem", "Cisco", "reference-spare"),
    ("PWR-C1-715WAC", "341-0524-01", "mpn", "Cisco", "numero-fabrication"),
    ("PWR-C1-715WAC-P", "PWR-C1-715WAC-P=", "oem", "Cisco", "reference-spare"),
    ("C9300-NM-8X", "C9300-NM-8X=", "oem", "Cisco", "reference-spare"),
    ("WS-C3850-24T-S", "WS-C3850-24T", "oem", "Cisco", "reference-base"),
    ("ISR4321/K9", "ISR4321", "oem", "Cisco", "reference-base"),
    ("EX-SFP-10GE-SR", "740-021308", "mpn", "Juniper Networks", "numero-fabrication"),
    ("450-AEBN", "0V1YJ6", "oem", "Dell", "FRU"),
    ("450-AFJN", "0HTRH4", "oem", "Dell", "FRU"),
    ("450-AHLH", "0CMPGM", "oem", "Dell", "FRU"),
    ("0X8DXD", "405-AAEK", "oem", "Dell", "reference-marketing"),
    ("405-AAER", "0JJ5VG", "oem", "Dell", "FRU"),
    ("400-BCNT", "077K16", "oem", "Dell", "FRU"),
    ("511778-001", "499250-201", "oem", "HPE", "numero-modele"),
    ("720478-B21", "723595-101", "oem", "HPE", "numero-spare"),
    ("865408-B21", "866729-001", "oem", "HPE", "numero-spare"),
    ("865414-B21", "866730-001", "oem", "HPE", "numero-spare"),
    ("726736-B21", "749797-001", "oem", "HPE", "numero-spare"),
    ("P18434-B21", "P18424-B21", "oem", "HPE", "variante-smartcarrier"),
    ("872479-B21", "872737-001", "oem", "HPE", "numero-spare"),
    ("01AV430", "SB10K97586", "oem", "Lenovo", "numero-ASM"),
    ("00HW028", "SB10F46466", "oem", "Lenovo", "numero-ASM"),
    ("01AV489", "SB10K97583", "oem", "Lenovo", "numero-ASM"),
    ("4XB7A17074", "ST1000NX0423", "mpn", "Seagate", "fabricant-origine"),
]

# --------------------------------------------------------- compatibilities
# (ref_a, ref_b, confidence, source) — liens bidirectionnels générés
COMPATIBILITIES = [
    ("LC1D18M7", "AF16-30-10-13", 0.8, "equivalence-fonctionnelle"),
    ("LC1D09M7", "AF09-30-10-13", 0.8, "equivalence-fonctionnelle"),
    ("LC1D25M7", "AF26-30-00-13", 0.75, "equivalence-fonctionnelle"),
    ("6EP1334-2BA20", "2904601", 0.7, "equivalence-fonctionnelle"),
    ("6EP1334-2BA20", "ABLS1A24100", 0.7, "equivalence-fonctionnelle"),
    ("2904601", "CP-E 24/10.0", 0.7, "equivalence-fonctionnelle"),
    ("DSBC-32-100-PPVA-N3", "CDQ2B32-25DZ", 0.5, "alternative-pneumatique"),
    ("34461A", "FLUKE-87-5", 0.4, "alternative-banc-vs-portable"),
    ("GLC-SX-MMD", "EX-SFP-1GE-SX", 0.6, "form-factor-identique-vendor-lock"),
    ("SFP-10G-SR", "EX-SFP-10GE-SR", 0.6, "form-factor-identique-vendor-lock"),
    ("720478-B21", "865408-B21", 0.5, "generation-suivante-meme-format"),
]

# ----------------------------------------------------------- offres par pool
# pool -> (vendeurs actifs, vendeurs obsolète) : (seller_id, facteur prix, dispo)
POOLS = {
    "auto": {
        "active": [(2, 1.0, "En stock"), (6, 0.97, "En stock"), (4, 0.72, "Surplus neuf")],
        "obsolete": [(4, 1.0, "Reconditionné, garanti 2 ans"), (5, 1.18, "Surplus neuf"), (9, 0.62, "Occasion testée")],
    },
    "test": {
        "active": [(10, 1.0, "En stock"), (2, 1.04, "En stock"), (11, 0.98, "En stock")],
        "obsolete": [(4, 1.0, "Reconditionné, calibré"), (9, 0.6, "Occasion testée"), (11, 1.1, "Surplus neuf")],
    },
    "it": {
        "active": [(7, 1.0, "En stock"), (8, 0.85, "Reconditionné, garanti 1 an"), (2, 1.08, "En stock")],
        "obsolete": [(8, 1.0, "Reconditionné, garanti 1 an"), (7, 1.12, "Surplus neuf"), (9, 0.58, "Occasion testée")],
    },
}
# Siemens actif : la première offre vient du Mall constructeur
SIEMENS_ACTIVE = [(1, 1.0, "En stock"), (2, 0.96, "En stock"), (4, 0.72, "Surplus neuf")]


def main():
    out = []
    out.append("-- ============================================================")
    out.append("-- SparePartSearch — catalogue étendu industrie + informatique")
    out.append(f"-- {len(P)} pièces, {len(MANUFACTURERS)} fabricants, {len(SELLERS)} vendeurs.")
    out.append("-- À coller dans le SQL Editor de Neon et exécuter en une fois.")
    out.append("-- VIDE les données existantes puis insère le nouveau catalogue.")
    out.append("-- (Les tables doivent déjà exister — créées lors du premier setup.)")
    out.append("-- ============================================================")
    out.append("")
    out.append("TRUNCATE offers, compatibilities, supersessions, part_references, parts, sellers, categories, manufacturers RESTART IDENTITY CASCADE;")
    out.append("")

    for c in CATEGORIES:
        out.append(f"INSERT INTO public.categories VALUES ({c[0]}, {sqlstr(c[1])}, {sqlstr(c[2])}, '{c[3]}', NULL);")
    out.append("")
    for m in MANUFACTURERS:
        out.append(f"INSERT INTO public.manufacturers VALUES ({m[0]}, {sqlstr(m[1])}, {sqlstr(m[2])}, '{m[3]}', {sqlstr(m[4])});")
    out.append("")
    for s in SELLERS:
        out.append(f"INSERT INTO public.sellers VALUES ({s[0]}, {sqlstr(s[1])}, {sqlstr(s[2])}, '{s[3]}', {sqlstr(s[4])}, {sqlstr(s[5])});")
    out.append("")

    # parts
    id_by_ref = {}
    pool_by_id = {}
    mfr_by_id = {}
    for i, (mfr, cat, ref, name, desc, status, attrs, price, pool) in enumerate(P, start=1):
        n = norm(ref)
        key = (mfr, n)
        if key in id_by_ref.values():
            raise SystemExit(f"Doublon : {ref}")
        if ref in id_by_ref:
            raise SystemExit(f"Référence en double : {ref}")
        id_by_ref[ref] = i
        pool_by_id[i] = (pool, status, price)
        mfr_by_id[i] = mfr
        out.append(
            f"INSERT INTO public.parts VALUES ({i}, {mfr}, {cat}, {sqlstr(ref)}, '{n}', '{n.lower()}', "
            f"{sqlstr(name)}, {sqlstr(desc)}, '{status}', NULL, {sqljson(attrs)}, '{TS}', '{TS}');"
        )
    out.append("")

    # part_references
    rid = 0
    seen_refs = set()
    for owner, alt, rtype, brand, source in REFERENCES:
        pid = id_by_ref[owner]
        n = norm(alt)
        if (pid, n) in seen_refs or n == norm(owner):
            continue
        seen_refs.add((pid, n))
        rid += 1
        out.append(
            f"INSERT INTO public.part_references VALUES ({rid}, {pid}, {sqlstr(alt)}, '{n}', '{rtype}', {sqlstr(brand)}, {sqlstr(source)});"
        )
    out.append("")

    # supersessions
    for sid, (old, new, note) in enumerate(SUPERSESSIONS, start=1):
        out.append(
            f"INSERT INTO public.supersessions VALUES ({sid}, {id_by_ref[old]}, {id_by_ref[new]}, 'catalogue-constructeur', {sqlstr(note)});"
        )
    out.append("")

    # compatibilities (bidirectionnel)
    cid = 0
    for a, b, conf, source in COMPATIBILITIES:
        pa, pb = id_by_ref[a], id_by_ref[b]
        for x, y in ((pa, pb), (pb, pa)):
            cid += 1
            out.append(
                f"INSERT INTO public.compatibilities VALUES ({cid}, {x}, {y}, {conf}, {sqlstr(source)});"
            )
    out.append("")

    # offers
    oid = 0
    for pid in sorted(pool_by_id):
        pool, status, price = pool_by_id[pid]
        if pool == "auto" and status == "active" and mfr_by_id[pid] == 1:
            entries = SIEMENS_ACTIVE
        else:
            entries = POOLS[pool]["active" if status == "active" else "obsolete"]
        # 2 ou 3 offres selon l'id pour varier
        count = 3 if pid % 3 != 0 else 2
        for seller_id, factor, avail in entries[:count]:
            oid += 1
            p = round(price * factor, 2)
            out.append(
                f"INSERT INTO public.offers VALUES ({oid}, {pid}, {seller_id}, {p:.2f}, 'EUR', {sqlstr(avail)}, {sqlstr(SELLER_URL[seller_id])}, '{TS}');"
            )
    out.append("")

    # séquences
    for table in ("manufacturers", "categories", "parts", "part_references", "supersessions", "compatibilities", "sellers", "offers"):
        out.append(f"SELECT setval('{table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM {table}));")
    out.append("")

    sql = "\n".join(out)
    with open("neon-catalog.sql", "w", encoding="utf-8") as f:
        f.write(sql)
    n_parts = len(P)
    n_obs = sum(1 for p in P if p[5] == "obsolete")
    print(f"neon-catalog.sql généré : {n_parts} pièces ({n_obs} obsolètes), "
          f"{len(SUPERSESSIONS)} remplacements, {rid} cross-références, {cid} compatibilités, {oid} offres.")


if __name__ == "__main__":
    main()
