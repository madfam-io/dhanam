/**
 * Mapping functions for MADFAM CSV import.
 *
 * Converts raw CSV data into Dhanam-compatible entities.
 */
import type { MadfamCsvRow, SpaceTarget, AccountMapping } from './madfam-csv-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUSINESS_RFC = 'IMA2501164Y7';

/** Canonical account definitions keyed by Cuenta_Origen */
const ACCOUNT_DEFS: Record<string, { slug: string; name: string; type: 'checking' | 'credit' }> = {
  'BBVA Empresarial': { slug: 'bbva-empresarial', name: 'BBVA Empresarial', type: 'checking' },
  'Banamex Joy Personal': {
    slug: 'banamex-joy',
    name: 'Banamex Joy Personal',
    type: 'checking',
  },
  'BBVA Azul Personal': { slug: 'bbva-azul', name: 'BBVA Azul Personal', type: 'credit' },
  'Banamex Oro Personal': { slug: 'banamex-oro', name: 'Banamex Oro Personal', type: 'credit' },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the RFC corresponds to the business entity (Innovaciones MADFAM).
 */
export function isBusinessRfc(rfc: string): boolean {
  return rfc.trim().toUpperCase() === BUSINESS_RFC;
}

/**
 * Determine which space a transaction routes to based on RFC and accounting classification.
 *
 * Routing rules:
 * - Business RFC (IMA2501164Y7) → "innovaciones-madfam"
 * - Personal RFC + "Gasto No Deducible" → "aldo-personal"
 * - Personal RFC + anything else → "socio-afac"
 */
export function routeToSpace(rfc: string, clasificacion: string): SpaceTarget {
  if (isBusinessRfc(rfc)) return 'innovaciones-madfam';
  if (clasificacion.trim() === 'Gasto No Deducible') return 'aldo-personal';
  return 'socio-afac';
}

/**
 * Map a Cuenta_Origen + space target to an account with unique providerAccountId.
 *
 * Personal-RFC accounts get a suffix based on space:
 * - Space "socio-afac" → "-afac"
 * - Space "aldo-personal" → "-personal"
 * - Space "innovaciones-madfam" → no suffix (only BBVA Empresarial)
 *
 * @throws Error if the account name is not recognized
 */
export function mapAccount(cuentaOrigen: string, spaceTarget: SpaceTarget): AccountMapping {
  const def = ACCOUNT_DEFS[cuentaOrigen];
  if (!def) {
    throw new Error(`Unknown Cuenta_Origen: "${cuentaOrigen}"`);
  }

  let suffix = '';
  if (spaceTarget === 'socio-afac') suffix = '-afac';
  else if (spaceTarget === 'aldo-personal') suffix = '-personal';

  return {
    providerAccountId: `madfam-csv-${def.slug}${suffix}`,
    name: def.name,
    type: def.type,
  };
}

/**
 * Parse a potentially comma-formatted number string to a float.
 * Strips commas before parsing (e.g. "1,614.69" → 1614.69).
 * Returns 0 for empty/whitespace-only strings.
 */
export function parseAmount(raw: string): number {
  const cleaned = (raw || '').replace(/,/g, '').trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return num;
}

/**
 * Compute signed transaction amount.
 * Income (Ingreso) is positive, expense (Egreso) is negative.
 *
 * @returns signed amount, or null if both are zero
 */
export function mapAmount(ingreso: string, egreso: string): number | null {
  const inc = parseAmount(ingreso);
  const exp = parseAmount(egreso);
  if (inc > 0) return inc;
  if (exp > 0) return -exp;
  if (inc === 0 && exp === 0) return null;
  return 0;
}

/**
 * Parse a YYYY-MM-DD date string, setting time to noon UTC to avoid timezone drift.
 */
export function mapDate(fechaOperacion: string): Date {
  const trimmed = fechaOperacion.trim();
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`Invalid date format: "${fechaOperacion}" (expected YYYY-MM-DD)`);
  }
  return new Date(`${trimmed}T12:00:00Z`);
}

/**
 * Extract groupName and category name from Categoria_Estrategica and Subcategoria.
 *
 * groupName comes from strategic category (I+D, OpEx, CapEx, etc.)
 * categoryName comes from subcategory.
 */
export function parseGroupAndCategory(
  categoriaEstrategica: string,
  subcategoria: string
): { groupName: string; categoryName: string } {
  return {
    groupName: categoriaEstrategica.trim(),
    categoryName: subcategoria.trim(),
  };
}

/**
 * Determine if a category group is income-producing.
 * Only "Financiamiento" is income (treasury/capital inflows).
 */
export function isIncomeGroup(groupName: string): boolean {
  return groupName === 'Financiamiento';
}

/**
 * Parse a single CSV line into column values, handling quoted fields.
 */
export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        values.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  values.push(current);
  return values;
}

/**
 * Parse a CSV row from column values and header names.
 */
export function parseCsvRow(values: string[], headers: string[]): MadfamCsvRow {
  const row: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    row[headers[i]] = (values[i] || '').trim();
  }
  return row as unknown as MadfamCsvRow;
}

/**
 * Parse full CSV content into an array of MadfamCsvRow.
 */
export function parseCsv(content: string): MadfamCsvRow[] {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: MadfamCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    rows.push(parseCsvRow(values, headers));
  }

  return rows;
}
