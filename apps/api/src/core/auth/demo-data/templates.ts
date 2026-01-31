/** Shared helpers and templates for demo data generation. */

export const randomAmount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

export const transactionTemplates = {
  income: {
    personal_mx: [
      { merchant: 'Nómina BBVA', category: 'Salary', range: [25000, 45000] as const },
      { merchant: 'Freelance Transfer', category: 'Freelance', range: [5000, 18000] as const },
      { merchant: 'CETES Rendimiento', category: 'Investment', range: [500, 3000] as const },
    ],
    personal_us: [
      {
        merchant: 'Direct Deposit - TechCorp',
        category: 'Salaries',
        range: [35000, 50000] as const,
      },
      { merchant: 'Vanguard Dividends', category: 'Investment', range: [2000, 8000] as const },
      { merchant: 'Consulting Fee', category: 'Freelance', range: [5000, 15000] as const },
    ],
    business_mx: [
      { merchant: 'Ventas del Día', category: 'Revenue', range: [15000, 45000] as const },
      { merchant: 'Catering Order', category: 'Revenue', range: [8000, 25000] as const },
      { merchant: 'UberEats Deposit', category: 'Revenue', range: [5000, 18000] as const },
    ],
  },
  expenses: {
    personal_mx: [
      { merchant: 'Oxxo', category: 'Groceries', range: [80, 450] as const },
      { merchant: 'Soriana', category: 'Groceries', range: [800, 3200] as const },
      { merchant: 'Walmart', category: 'Groceries', range: [600, 3500] as const },
      { merchant: 'Bodega Aurrera', category: 'Groceries', range: [300, 2000] as const },
      { merchant: 'Netflix MX', category: 'Entertainment', range: [149, 299] as const },
      { merchant: 'Spotify MX', category: 'Entertainment', range: [115, 169] as const },
      { merchant: 'Disney+', category: 'Entertainment', range: [159, 219] as const },
      { merchant: 'CFE', category: 'Utilities', range: [350, 2200] as const },
      { merchant: 'Telmex', category: 'Utilities', range: [499, 1099] as const },
      { merchant: 'Totalplay', category: 'Utilities', range: [599, 1199] as const },
      { merchant: 'Pemex', category: 'Transportation', range: [400, 1400] as const },
      { merchant: 'Uber', category: 'Transportation', range: [65, 320] as const },
      { merchant: 'DiDi', category: 'Transportation', range: [55, 280] as const },
      { merchant: 'Starbucks', category: 'Food & Dining', range: [75, 180] as const },
      { merchant: 'Rappi', category: 'Food & Dining', range: [120, 550] as const },
      { merchant: 'Uber Eats MX', category: 'Food & Dining', range: [100, 480] as const },
      { merchant: 'Amazon MX', category: 'Shopping', range: [250, 2500] as const },
      { merchant: 'Liverpool', category: 'Shopping', range: [800, 5000] as const },
      { merchant: 'MercadoLibre', category: 'Shopping', range: [150, 3500] as const },
      { merchant: 'Farmacias del Ahorro', category: 'Shopping', range: [120, 800] as const },
      { merchant: 'Cinepolis', category: 'Entertainment', range: [160, 550] as const },
    ],
    personal_us: [
      { merchant: 'Whole Foods', category: 'Groceries', range: [40, 280] as const },
      { merchant: 'Costco US', category: 'Groceries', range: [80, 400] as const },
      { merchant: 'Target', category: 'Shopping', range: [30, 200] as const },
      { merchant: 'Amazon', category: 'Shopping', range: [15, 350] as const },
      { merchant: 'Netflix', category: 'Entertainment', range: [10, 23] as const },
      { merchant: 'Uber', category: 'Transportation', range: [12, 65] as const },
      { merchant: 'Starbucks', category: 'Food & Dining', range: [5, 12] as const },
    ],
    business_mx: [
      { merchant: 'Nómina Empleados', category: 'Payroll', range: [35000, 80000] as const },
      { merchant: 'Central de Abastos', category: 'Inventory', range: [8000, 25000] as const },
      { merchant: 'Costco Wholesale', category: 'Inventory', range: [5000, 18000] as const },
      { merchant: 'Renta Local', category: 'Rent', range: [35000, 45000] as const },
      { merchant: 'Gas LP Delivery', category: 'Utilities', range: [2000, 5000] as const },
      { merchant: 'Sysco México', category: 'Inventory', range: [12000, 30000] as const },
      { merchant: 'Limpieza Industrial', category: 'Supplies', range: [1500, 4000] as const },
      { merchant: 'Seguro Negocio', category: 'Insurance', range: [3000, 8000] as const },
    ],
    defi: [
      { merchant: 'Uniswap V3', category: 'Crypto Investments', range: [200, 3000] as const },
      { merchant: 'Aave V3', category: 'Crypto Investments', range: [500, 5000] as const },
      { merchant: 'Curve Finance', category: 'Crypto Investments', range: [300, 4000] as const },
      { merchant: 'Lido', category: 'Crypto Investments', range: [400, 4500] as const },
      { merchant: 'Ethereum Gas', category: 'Gas Fees', range: [5, 80] as const },
      { merchant: 'Polygon Bridge', category: 'Gas Fees', range: [1, 15] as const },
    ],
  },
};

export const cryptoESGData = [
  { symbol: 'BTC', env: 35, social: 65, gov: 70 },
  { symbol: 'ETH', env: 75, social: 80, gov: 85 },
  { symbol: 'SOL', env: 82, social: 72, gov: 65 },
  { symbol: 'MATIC', env: 80, social: 75, gov: 78 },
  { symbol: 'UNI', env: 74, social: 78, gov: 88 },
  { symbol: 'AAVE', env: 76, social: 82, gov: 90 },
  { symbol: 'SAND', env: 45, social: 72, gov: 58 },
  { symbol: 'ENS', env: 78, social: 80, gov: 86 },
  { symbol: 'LINK', env: 72, social: 76, gov: 80 },
  { symbol: 'CRV', env: 72, social: 70, gov: 85 },
  { symbol: 'LDO', env: 78, social: 76, gov: 72 },
  { symbol: 'ADA', env: 88, social: 85, gov: 90 },
  { symbol: 'DOT', env: 80, social: 78, gov: 88 },
  { symbol: 'AVAX', env: 84, social: 75, gov: 82 },
  { symbol: 'APE', env: 44, social: 82, gov: 60 },
];

/** Distribute dates on consistent biweekly salary schedule. */
export function biweeklySalaryDates(daysBack: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  for (let d = daysBack; d >= 0; d -= 14) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    // Snap to 1st or 15th
    dt.setDate(dt.getDate() <= 15 ? 15 : 1);
    dates.push(dt);
  }
  return dates;
}

/** Distribute dates on monthly schedule (1st of month). */
export function monthlySalaryDates(daysBack: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= now) {
    dates.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return dates;
}
