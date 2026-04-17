/**
 * Update salary benchmarks from IBGE SIDRA (PNAD Contínua).
 *
 * Data source:
 *   PNAD Contínua - Rendimento médio habitual por ocupação (CBO Domiciliar)
 *   API: https://apisidra.ibge.gov.br/
 *   Table 6462: Rendimento médio real habitual por ocupação
 *
 * CBO codes used (Classificação Brasileira de Ocupações):
 *   2122 — Analistas de sistemas computacionais
 *   2123 — Programadores de sistemas de informação
 *   2124 — Administradores de redes, sistemas e banco de dados
 *   2521 — Analistas de sistemas e aplicações
 *   3722 — Técnicos em eletrônica e afins
 *
 * Usage:
 *   pnpm update:salary
 *
 * Requires: no API keys needed — IBGE SIDRA is public.
 *
 * What it does:
 *   1. Fetches quarterly wage data by CBO code and UF from IBGE SIDRA
 *   2. Calculates regional multipliers relative to SP baseline
 *   3. Prints a report comparing current benchmarks with IBGE data
 *   4. Does NOT auto-overwrite — review and update manually from the report
 */

const SIDRA_BASE = 'https://apisidra.ibge.gov.br/values';

// CBO → role mapping for IBGE lookup
const CBO_ROLES: Record<string, string> = {
  '2122': 'Analistas de sistemas computacionais',
  '2123': 'Programadores de sistemas de informação',
  '2124': 'Administradores de redes, sistemas e banco de dados',
  '2521': 'Analistas de sistemas e aplicações',
};

// UF codes for regional comparison
const UF_CODES: Record<string, string> = {
  '35': 'São Paulo',
  '33': 'Rio de Janeiro',
  '31': 'Minas Gerais',
  '41': 'Paraná',
  '43': 'Rio Grande do Sul',
  '42': 'Santa Catarina',
  '53': 'Distrito Federal',
  '29': 'Bahia',
  '26': 'Pernambuco',
  '23': 'Ceará',
};

interface SidraValue {
  D1C: string;  // UF code
  D1N: string;  // UF name
  D2C: string;  // Quarter
  D2N: string;  // Quarter name
  V: string;    // Value
}

async function fetchSidraTable(tableId: string, variable: string, classification: string): Promise<SidraValue[]> {
  // SIDRA API format: /t/{table}/n1/all/v/{variable}/p/last1/c{classification}/allxt/d/v{variable}0
  const url = `${SIDRA_BASE}/t/${tableId}/n3/${Object.keys(UF_CODES).join(',')}/v/${variable}/p/last4/d/v${variable}0`;

  console.log(`  Fetching: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`SIDRA API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as SidraValue[];
  // First element is header row in SIDRA API
  return data.slice(1);
}

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  MatchCV — Salary Benchmarks Update Report');
  console.log('  Source: IBGE SIDRA — PNAD Contínua');
  console.log('═══════════════════════════════════════════════════════\n');

  // Table 6462: Rendimento médio real habitual de todos os trabalhos
  // Variable 5929: Rendimento médio real habitual
  // This is a simplified fetch — full implementation would filter by CBO
  console.log('Fetching PNAD Contínua data from IBGE SIDRA...\n');

  try {
    // Fetch rendimento médio por UF (all occupations — proxy for tech adjustment)
    // Table 5439: Rendimento médio mensal real das pessoas de 14 anos ou mais por UF
    const url = `${SIDRA_BASE}/t/5439/n3/${Object.keys(UF_CODES).join(',')}/v/5932/p/last1/d/v59320`;

    console.log(`Endpoint: ${url}\n`);

    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`  ⚠ IBGE SIDRA returned ${res.status}. The API may have changed.`);
      console.warn('  Check https://apisidra.ibge.gov.br/ for updated table/variable codes.\n');
      printManualInstructions();
      return;
    }

    const raw = await res.json() as SidraValue[];
    const rows = raw.slice(1).filter((r) => r.V && r.V !== '-' && r.V !== '...');

    if (rows.length === 0) {
      console.warn('  ⚠ No data rows returned. Table structure may have changed.\n');
      printManualInstructions();
      return;
    }

    // Find SP baseline
    const spRow = rows.find((r) => r.D1C === '35');
    const spValue = spRow ? parseFloat(spRow.V) : null;

    if (!spValue) {
      console.warn('  ⚠ Could not find São Paulo baseline. Aborting multiplier calculation.\n');
      return;
    }

    console.log('Regional multipliers (relative to SP baseline):');
    console.log('─────────────────────────────────────────────\n');

    const multipliers: Record<string, number> = {};

    for (const row of rows) {
      const ufName = UF_CODES[row.D1C] || row.D1N;
      const value = parseFloat(row.V);
      if (!isNaN(value)) {
        const multiplier = value / spValue;
        multipliers[ufName] = multiplier;
        const indicator = multiplier >= 1.0 ? '↑' : '↓';
        console.log(`  ${ufName.padEnd(20)} ${formatBRL(value).padEnd(14)} ${indicator} ${multiplier.toFixed(3)}x`);
      }
    }

    console.log(`\n  SP Baseline: ${formatBRL(spValue)}/mês (rendimento médio habitual)`);
    console.log(`  Period: ${rows[0]?.D2N ?? 'N/A'}`);

    console.log('\n─────────────────────────────────────────────');
    console.log('\nComparison with current REGIONAL_MULTIPLIERS in salary-benchmarks.ts:\n');

    const currentMultipliers: Record<string, number> = {
      'São Paulo': 1.00,
      'Rio de Janeiro': 0.87,
      'Minas Gerais': 0.75,
      'Paraná': 0.82,
      'Rio Grande do Sul': 0.78,
      'Santa Catarina': 0.81,
      'Distrito Federal': 0.88,
      'Bahia': 0.65,
      'Pernambuco': 0.65,
      'Ceará': 0.63,
    };

    for (const [state, ibgeMultiplier] of Object.entries(multipliers)) {
      const current = currentMultipliers[state];
      if (current !== undefined) {
        const diff = ibgeMultiplier - current;
        const diffStr = diff >= 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);
        const flag = Math.abs(diff) > 0.05 ? '  ← UPDATE RECOMMENDED' : '';
        console.log(`  ${state.padEnd(20)} IBGE: ${ibgeMultiplier.toFixed(3)}  current: ${current.toFixed(3)}  diff: ${diffStr}${flag}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  To update: edit lib/data/salary-benchmarks.ts');
    console.log('  REGIONAL_MULTIPLIERS section with values above.');
    console.log('  Then update the comment: "Updated: YYYY-MM"');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('  ✗ Failed to fetch IBGE data:', err instanceof Error ? err.message : err);
    printManualInstructions();
  }
}

function printManualInstructions() {
  console.log('Manual data sources:');
  console.log('  1. PNAD Contínua: https://www.ibge.gov.br/estatisticas/sociais/trabalho/17270-pnad-continua.html');
  console.log('  2. CAGED: https://caged.mte.gov.br/');
  console.log('  3. SIDRA API docs: https://apisidra.ibge.gov.br/home/ajuda');
  console.log('  4. State of Dev BR: https://survey.devbr.dev/');
  console.log('  5. Pesquisa Salarial Catho: https://www.catho.com.br/curriculos/pesquisa-salarial/\n');
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
