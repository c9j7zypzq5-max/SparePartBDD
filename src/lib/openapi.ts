import { siteUrl } from "@/lib/site-url";

/**
 * Spécification OpenAPI 3.1 de l'API publique v1.
 * Servie telle quelle par /api/v1/openapi.json — importable par Swagger UI,
 * Postman, les générateurs de SDK (openapi-generator), etc.
 */
export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "SparePartSearch API",
      version: "1.0.0",
      description:
        "API REST de recherche de pièces détachées industrielles et informatiques : statut de fabrication, références de remplacement, offres revendeurs.",
      contact: { name: "SparePartSearch", url: `${siteUrl}/developers` },
    },
    servers: [{ url: `${siteUrl}/api/v1`, description: "Production" }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/part/{reference}": {
        get: {
          summary: "Fiche complète d'une pièce",
          description:
            "Retourne le détail d'une pièce par sa référence (normalisée automatiquement) : statut, attributs, offres, remplacement.",
          operationId: "getPart",
          parameters: [
            {
              name: "reference",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "6ES7214-1AG40-0XB0",
            },
          ],
          responses: {
            "200": {
              description: "Pièce trouvée",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Part" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
            "429": { $ref: "#/components/responses/RateLimited" },
          },
        },
      },
      "/search": {
        get: {
          summary: "Recherche de pièces",
          description: "Recherche par référence ou nom de pièce, avec filtres.",
          operationId: "searchParts",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" }, example: "siemens s7-1200" },
            { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 20 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
            { name: "industry", in: "query", schema: { type: "string", enum: ["industrie", "informatique", "automobile", "electromenager", "hvac", "electronique"] } },
            { name: "status", in: "query", schema: { type: "string", enum: ["active", "obsolete", "unknown"] } },
            { name: "manufacturer", in: "query", schema: { type: "string" }, example: "siemens" },
            { name: "sort", in: "query", schema: { type: "string", enum: ["relevance", "price_asc", "price_desc", "name_asc"], default: "relevance" } },
          ],
          responses: {
            "200": {
              description: "Résultats",
              content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResults" } } },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "429": { $ref: "#/components/responses/RateLimited" },
          },
        },
      },
      "/manufacturer/{slug}": {
        get: {
          summary: "Catalogue d'un fabricant",
          operationId: "getManufacturer",
          parameters: [
            { name: "slug", in: "path", required: true, schema: { type: "string" }, example: "siemens" },
            { name: "limit", in: "query", schema: { type: "integer", maximum: 200, default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
            { name: "status", in: "query", schema: { type: "string", enum: ["active", "obsolete", "unknown"] } },
          ],
          responses: {
            "200": {
              description: "Catalogue paginé",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ManufacturerCatalog" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
            "429": { $ref: "#/components/responses/RateLimited" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "spb_…", description: "Clé API : Authorization: Bearer spb_…" },
      },
      schemas: {
        Offer: {
          type: "object",
          properties: {
            seller: { type: "string" },
            sellerType: { type: "string", enum: ["constructeur", "distributeur_officiel", "aftermarket", "reconditionne", "occasion"] },
            price: { type: ["number", "null"] },
            currency: { type: ["string", "null"] },
            availability: { type: ["string", "null"] },
            url: { type: "string", format: "uri" },
            scrapedAt: { type: "string", format: "date-time" },
          },
        },
        Part: {
          type: "object",
          properties: {
            reference: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            status: { type: "string", enum: ["active", "obsolete", "unknown"] },
            manufacturer: {
              type: "object",
              properties: { name: { type: "string" }, slug: { type: "string" }, industry: { type: "string" } },
            },
            category: { type: ["string", "null"] },
            attributes: { type: "object", additionalProperties: { type: "string" } },
            productUrl: { type: ["string", "null"], format: "uri" },
            datasheetUrl: { type: ["string", "null"], format: "uri" },
            supersededBy: {
              type: ["object", "null"],
              properties: { reference: { type: "string" }, name: { type: "string" } },
            },
            offers: { type: "array", items: { $ref: "#/components/schemas/Offer" } },
          },
        },
        SearchHit: {
          type: "object",
          properties: {
            reference: { type: "string" },
            name: { type: "string" },
            status: { type: "string" },
            manufacturer: { type: "string" },
            industry: { type: "string" },
            score: { type: "number" },
            pageUrl: { type: "string", format: "uri" },
          },
        },
        SearchResults: {
          type: "object",
          properties: {
            query: { type: "string" },
            total: { type: "integer" },
            offset: { type: "integer" },
            results: { type: "array", items: { $ref: "#/components/schemas/SearchHit" } },
          },
        },
        ManufacturerCatalog: {
          type: "object",
          properties: {
            manufacturer: {
              type: "object",
              properties: { name: { type: "string" }, slug: { type: "string" }, industry: { type: "string" }, website: { type: ["string", "null"] } },
            },
            total: { type: "integer" },
            offset: { type: "integer" },
            limit: { type: "integer" },
            parts: { type: "array", items: { $ref: "#/components/schemas/SearchHit" } },
          },
        },
        Error: { type: "object", properties: { error: { type: "string" } } },
      },
      responses: {
        BadRequest:   { description: "Paramètre invalide", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        Unauthorized: { description: "Clé API manquante ou invalide", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        NotFound:     { description: "Ressource introuvable", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        RateLimited:  { description: "Quota mensuel dépassé", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      },
    },
  };
}
