# Prompt Ollama — Collecte de pièces détachées

Copie-colle ce prompt dans une session Ollama (ou via l'API).
Remplace `[BATCH_ID]` et la liste dans `[REFERENCES A RECHERCHER]`.

---

```
Tu es un agent de collecte de données pour une base de pièces détachées industrielles et informatiques.

Ta mission : pour chaque référence listée ci-dessous, rechercher sur internet les informations disponibles et produire un JSON strict. Tu dois UNIQUEMENT répondre avec le JSON — aucun texte avant ou après.

## Références à traiter (batch [BATCH_ID])

[REFERENCES A RECHERCHER — une par ligne, ex :
Siemens 6ES7214-1AG31-0XB0
Cisco PWR-C1-715WAC
ABB ACS550-01-038A-4
Rockwell 1756-L71
Dell 0X8DXD
]

## Pour chaque pièce, cherche :
1. Le nom exact du produit
2. Le statut de fabrication : "active" (encore fabriqué), "obsolete" (discontinué/phase-out/end-of-life), ou "unknown"
3. La référence de remplacement OFFICIELLE (si obsolète) — même fabricant de préférence
4. Les pièces compatibles alternatives tierces (autres fabricants)
5. Les prix chez différents vendeurs (neuf, reconditionné, occasion)
6. Les numéros de référence alternatifs (autres catalogues, numéros OEM différents)

## Sources fiables à consulter :
- Siemens : Industry Mall (mall.industry.siemens.com), SiePortal, Product Information Letters
- Rockwell : rockwellautomation.com > Support > Product Lifecycle
- Schneider : se.com/product-substitution ou se.com + référence
- Cisco : cisco.com/c/en/us/products/eos-eol-listing.html
- Dell : parts.dell.com
- HPE : partsurfer.hpe.com
- Radwell, EU Automation, ServerSupply, eBay pour les prix

## Format JSON EXACT à produire (IngestPayload) :

{
  "source": "ollama-batch-[BATCH_ID]",
  "parts": [
    {
      "manufacturer": "Siemens",
      "industry": "industrie",
      "reference": "6ES7214-1AG31-0XB0",
      "name": "CPU S7-1200 1214C DC/DC/DC (gen. 1)",
      "description": "Automate SIMATIC S7-1200, CPU 1214C, 14 entrées TOR, 10 sorties TOR. Phase-out annoncé.",
      "status": "obsolete",
      "category": "Automates programmables",
      "attributes": {
        "Alimentation": "24 V DC",
        "Mémoire": "75 KB"
      },
      "crossReferences": [
        { "reference": "6ES7 214-1AG31-0XB0", "type": "oem", "brand": "Siemens" }
      ],
      "supersededBy": "6ES7214-1AG40-0XB0",
      "compatibleWith": [],
      "offers": [
        {
          "sellerName": "Radwell",
          "sellerType": "reconditionne",
          "sellerWebsite": "https://www.radwell.com",
          "price": 420.00,
          "currency": "USD",
          "availability": "Reconditionné, garanti 2 ans",
          "url": "https://www.radwell.com/en-US/Buy/SIEMENS/SIMATIC%20S7-1200/6ES7214-1AG31-0XB0"
        }
      ]
    }
  ]
}

## Valeurs autorisées :
- industry : "industrie", "informatique", "automobile", "electromenager", "hvac", "electronique"
- status : "active", "obsolete", "unknown"
- type (crossReferences) : "oem", "aftermarket", "ean", "mpn"
- sellerType : "constructeur", "distributeur_officiel", "aftermarket", "reconditionne", "occasion"

## Règles importantes :
- Si une information est inconnue, omets le champ (ne mets pas null ni "")
- supersededBy = référence (string) chez le MÊME fabricant uniquement
- compatibleWith = ["NomFabricant|Référence"] pour les équivalents d'autres fabricants
- Inclure au moins une offre si le prix est trouvable
- Le JSON doit être valide et parseable — aucun commentaire à l'intérieur

Commence maintenant. Réponds UNIQUEMENT avec le JSON.
```

---

## Utilisation avec l'API Ollama (Mac mini)

### Session interactive
```bash
ollama run qwen2.5:14b "$(cat prompt-batch-001.txt)"
```

### Via l'API HTTP (pour parallélisation)
```bash
curl http://localhost:11434/api/generate \
  -d '{
    "model": "qwen2.5:14b",
    "prompt": "'$(cat prompt-batch-001.txt | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" | tr -d '"')'",
    "stream": false
  }' | jq -r '.response' > output-batch-001.json
```

### Script de parallélisation (N sessions en simultané)
```bash
#!/bin/bash
# Lancer 4 sessions en parallèle sur des lots différents
for i in 001 002 003 004; do
  (
    ollama run qwen2.5:14b "$(cat prompt-batch-$i.txt)" > output-batch-$i.json
    echo "Batch $i terminé"
  ) &
done
wait
echo "Tous les batchs terminés"
```

### Envoyer le résultat à l'API
```bash
# Pour chaque fichier de sortie Ollama :
INGEST_API_KEY=ta_cle_secrete \
INGEST_URL=https://ton-site.vercel.app \
npx tsx scripts/ingest/push.ts output-batch-001.json
```

## Modèles recommandés sur Mac mini

| Modèle | Avantage | RAM nécessaire |
|---|---|---|
| `qwen2.5:14b` | Bonne suivance des instructions JSON, bonne connaissance des produits industriels/IT | 16 GB |
| `llama3.1:8b` | Plus rapide, moins précis | 8 GB |
| `deepseek-r1:14b` | Bon pour les recherches structurées | 16 GB |

Si le Mac mini a de la RAM (32+ GB), utilise `qwen2.5:32b` pour une meilleure précision.

## Conseil : vérification avant push

Avant d'envoyer un fichier JSON à l'API, vérifie qu'il est valide :
```bash
cat output-batch-001.json | python3 -m json.tool > /dev/null && echo "JSON valide"
```

Si Ollama a ajouté du texte avant/après le JSON, extrait-le avec :
```bash
cat output-batch-001.json | python3 -c "
import sys, json, re
txt = sys.stdin.read()
m = re.search(r'\{.*\}', txt, re.DOTALL)
if m:
    obj = json.loads(m.group())
    print(json.dumps(obj, ensure_ascii=False, indent=2))
" > output-batch-001-clean.json
```
