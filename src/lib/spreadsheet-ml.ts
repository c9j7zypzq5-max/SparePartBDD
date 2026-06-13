/**
 * Génère un fichier Excel au format SpreadsheetML (Excel 2003 XML).
 * Compatible Excel, LibreOffice, Numbers — sans dépendance externe.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type CellValue = string | number | null | undefined;

export function buildSpreadsheetML(
  headers: string[],
  rows: CellValue[][],
  sheetName = "Export",
): string {
  function cell(value: CellValue): string {
    if (value == null || value === "") {
      return `<Cell><Data ss:Type="String"></Data></Cell>`;
    }
    if (typeof value === "number") {
      return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
    }
    return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
  }

  const headerRow = `<Row>${headers.map((h) => cell(h)).join("")}</Row>`;
  const dataRows = rows.map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      ${headerRow.replace(/<Cell>/g, '<Cell ss:StyleID="header">')}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function spreadsheetMLResponse(
  content: string,
  filename: string,
): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
