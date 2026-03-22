import {
  isBusinessRfc,
  routeToSpace,
  mapAccount,
  parseAmount,
  mapAmount,
  mapDate,
  parseGroupAndCategory,
  isIncomeGroup,
  parseCsvLine,
  parseCsv,
} from '../madfam-csv-mapper';

describe('madfam-csv-mapper', () => {
  // -----------------------------------------------------------------------
  // isBusinessRfc
  // -----------------------------------------------------------------------
  describe('isBusinessRfc', () => {
    it('returns true for business RFC IMA2501164Y7', () => {
      expect(isBusinessRfc('IMA2501164Y7')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(isBusinessRfc('ima2501164y7')).toBe(true);
    });

    it('trims whitespace', () => {
      expect(isBusinessRfc(' IMA2501164Y7 ')).toBe(true);
    });

    it('returns false for personal RFC RULA900317GPA', () => {
      expect(isBusinessRfc('RULA900317GPA')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // routeToSpace
  // -----------------------------------------------------------------------
  describe('routeToSpace', () => {
    it('routes business RFC to innovaciones-madfam', () => {
      expect(routeToSpace('IMA2501164Y7', 'Gasto Deducible (Negocio)')).toBe('innovaciones-madfam');
    });

    it('routes personal RFC + Gasto No Deducible to aldo-personal', () => {
      expect(routeToSpace('RULA900317GPA', 'Gasto No Deducible')).toBe('aldo-personal');
    });

    it('routes personal RFC + Préstamo de Socio (AFAC) to socio-afac', () => {
      expect(routeToSpace('RULA900317GPA', 'Préstamo de Socio (AFAC)')).toBe('socio-afac');
    });

    it('routes personal RFC + Gasto Deducible (Negocio) to socio-afac', () => {
      expect(routeToSpace('RULA900317GPA', 'Gasto Deducible (Negocio)')).toBe('socio-afac');
    });

    it('routes personal RFC + Aportación de Capital to socio-afac', () => {
      expect(routeToSpace('RULA900317GPA', 'Aportación de Capital')).toBe('socio-afac');
    });
  });

  // -----------------------------------------------------------------------
  // mapAccount
  // -----------------------------------------------------------------------
  describe('mapAccount', () => {
    it('maps BBVA Empresarial to innovaciones-madfam (no suffix)', () => {
      const result = mapAccount('BBVA Empresarial', 'innovaciones-madfam');
      expect(result).toEqual({
        providerAccountId: 'madfam-csv-bbva-empresarial',
        name: 'BBVA Empresarial',
        type: 'checking',
      });
    });

    it('maps Banamex Joy Personal with AFAC suffix', () => {
      const result = mapAccount('Banamex Joy Personal', 'socio-afac');
      expect(result).toEqual({
        providerAccountId: 'madfam-csv-banamex-joy-afac',
        name: 'Banamex Joy Personal',
        type: 'checking',
      });
    });

    it('maps Banamex Joy Personal with personal suffix', () => {
      const result = mapAccount('Banamex Joy Personal', 'aldo-personal');
      expect(result).toEqual({
        providerAccountId: 'madfam-csv-banamex-joy-personal',
        name: 'Banamex Joy Personal',
        type: 'checking',
      });
    });

    it('maps BBVA Azul Personal as credit', () => {
      const result = mapAccount('BBVA Azul Personal', 'socio-afac');
      expect(result).toEqual({
        providerAccountId: 'madfam-csv-bbva-azul-afac',
        name: 'BBVA Azul Personal',
        type: 'credit',
      });
    });

    it('maps Banamex Oro Personal as credit', () => {
      const result = mapAccount('Banamex Oro Personal', 'aldo-personal');
      expect(result).toEqual({
        providerAccountId: 'madfam-csv-banamex-oro-personal',
        name: 'Banamex Oro Personal',
        type: 'credit',
      });
    });

    it('throws for unknown account name', () => {
      expect(() => mapAccount('Unknown Bank', 'socio-afac')).toThrow(
        'Unknown Cuenta_Origen: "Unknown Bank"'
      );
    });
  });

  // -----------------------------------------------------------------------
  // parseAmount / mapAmount
  // -----------------------------------------------------------------------
  describe('parseAmount', () => {
    it('parses a simple number', () => {
      expect(parseAmount('100.50')).toBe(100.5);
    });

    it('strips commas from formatted numbers', () => {
      expect(parseAmount('1,614.69')).toBe(1614.69);
    });

    it('returns 0 for empty string', () => {
      expect(parseAmount('')).toBe(0);
    });

    it('returns 0 for whitespace-only string', () => {
      expect(parseAmount('   ')).toBe(0);
    });

    it('returns 0 for non-numeric string', () => {
      expect(parseAmount('abc')).toBe(0);
    });
  });

  describe('mapAmount', () => {
    it('returns positive for income-only', () => {
      expect(mapAmount('5,000.00', '0')).toBe(5000);
    });

    it('returns negative for expense-only', () => {
      expect(mapAmount('0', '1,614.69')).toBe(-1614.69);
    });

    it('returns null when both are zero', () => {
      expect(mapAmount('0', '0')).toBeNull();
    });

    it('returns null when both are empty', () => {
      expect(mapAmount('', '')).toBeNull();
    });

    it('prioritizes income when both are present', () => {
      expect(mapAmount('100', '50')).toBe(100);
    });

    it('handles comma-formatted expense', () => {
      expect(mapAmount('', '12,345.67')).toBe(-12345.67);
    });
  });

  // -----------------------------------------------------------------------
  // mapDate
  // -----------------------------------------------------------------------
  describe('mapDate', () => {
    it('parses YYYY-MM-DD to noon UTC', () => {
      const date = mapDate('2025-03-15');
      expect(date.toISOString()).toBe('2025-03-15T12:00:00.000Z');
    });

    it('trims whitespace', () => {
      const date = mapDate('  2024-12-01  ');
      expect(date.toISOString()).toBe('2024-12-01T12:00:00.000Z');
    });

    it('throws for invalid format', () => {
      expect(() => mapDate('03/15/2025')).toThrow('Invalid date format');
    });

    it('throws for empty string', () => {
      expect(() => mapDate('')).toThrow('Invalid date format');
    });
  });

  // -----------------------------------------------------------------------
  // parseGroupAndCategory
  // -----------------------------------------------------------------------
  describe('parseGroupAndCategory', () => {
    it('extracts I+D group with SaaS/AI category', () => {
      expect(parseGroupAndCategory('I+D', 'SaaS/AI')).toEqual({
        groupName: 'I+D',
        categoryName: 'SaaS/AI',
      });
    });

    it('extracts OpEx group', () => {
      expect(parseGroupAndCategory('OpEx', 'Telefonía (Telcel)')).toEqual({
        groupName: 'OpEx',
        categoryName: 'Telefonía (Telcel)',
      });
    });

    it('extracts CapEx group', () => {
      expect(parseGroupAndCategory('CapEx', 'Activo Digital')).toEqual({
        groupName: 'CapEx',
        categoryName: 'Activo Digital',
      });
    });

    it('extracts Financiamiento group', () => {
      expect(parseGroupAndCategory('Financiamiento', 'Tesorería')).toEqual({
        groupName: 'Financiamiento',
        categoryName: 'Tesorería',
      });
    });

    it('extracts Gasto Personal group', () => {
      expect(parseGroupAndCategory('Gasto Personal', 'Hundido')).toEqual({
        groupName: 'Gasto Personal',
        categoryName: 'Hundido',
      });
    });

    it('extracts Impuestos group', () => {
      expect(parseGroupAndCategory('Impuestos', 'IVA')).toEqual({
        groupName: 'Impuestos',
        categoryName: 'IVA',
      });
    });

    it('trims whitespace', () => {
      expect(parseGroupAndCategory('  I+D  ', '  SaaS/AI  ')).toEqual({
        groupName: 'I+D',
        categoryName: 'SaaS/AI',
      });
    });
  });

  // -----------------------------------------------------------------------
  // isIncomeGroup
  // -----------------------------------------------------------------------
  describe('isIncomeGroup', () => {
    it('returns true for Financiamiento', () => {
      expect(isIncomeGroup('Financiamiento')).toBe(true);
    });

    it('returns true for Financiamiento (Tesorería)', () => {
      expect(isIncomeGroup('Financiamiento (Tesorería)')).toBe(true);
    });

    it('returns false for I+D', () => {
      expect(isIncomeGroup('I+D')).toBe(false);
    });

    it('returns false for OpEx', () => {
      expect(isIncomeGroup('OpEx')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // parseCsvLine
  // -----------------------------------------------------------------------
  describe('parseCsvLine', () => {
    it('splits simple comma-separated values', () => {
      expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('handles quoted fields with commas', () => {
      expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
    });

    it('handles escaped quotes within quoted fields', () => {
      expect(parseCsvLine('a,"b""c",d')).toEqual(['a', 'b"c', 'd']);
    });

    it('handles empty fields', () => {
      expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
    });
  });

  // -----------------------------------------------------------------------
  // parseCsv
  // -----------------------------------------------------------------------
  describe('parseCsv', () => {
    it('parses CSV content with headers', () => {
      const csv = [
        'No_Transaccion,Fecha_Operacion,Concepto_Original,Nota_Items,Ingreso,Egreso,Cuenta_Origen,RFC,Moneda_Origen,Categoria_Estrategica,Subcategoria,Clasificacion_Contable,Mes_Corte',
        '1,2025-01-15,OpenAI,ChatGPT Pro,0,"1,614.69",BBVA Empresarial,IMA2501164Y7,USD,I+D,SaaS/AI,Gasto Deducible (Negocio),Enero 2025',
      ].join('\n');

      const rows = parseCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].No_Transaccion).toBe('1');
      expect(rows[0].Fecha_Operacion).toBe('2025-01-15');
      expect(rows[0].Concepto_Original).toBe('OpenAI');
      expect(rows[0].Nota_Items).toBe('ChatGPT Pro');
      expect(rows[0].Ingreso).toBe('0');
      expect(rows[0].Egreso).toBe('1,614.69');
      expect(rows[0].Cuenta_Origen).toBe('BBVA Empresarial');
      expect(rows[0].RFC).toBe('IMA2501164Y7');
      expect(rows[0].Moneda_Origen).toBe('USD');
      expect(rows[0].Categoria_Estrategica).toBe('I+D');
      expect(rows[0].Subcategoria).toBe('SaaS/AI');
      expect(rows[0].Clasificacion_Contable).toBe('Gasto Deducible (Negocio)');
    });

    it('returns empty array for content with only headers', () => {
      const csv = 'No_Transaccion,Fecha_Operacion';
      expect(parseCsv(csv)).toHaveLength(0);
    });

    it('returns empty array for empty content', () => {
      expect(parseCsv('')).toHaveLength(0);
    });
  });
});
