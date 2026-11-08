/** Public outlet labels only. PINs and account credentials belong on the server. */
export const VENDOR_OUTLETS = [
  { id: 'a0000000-0000-4000-8000-000000000001', name: 'MITS Canteen', code: 'MITS' },
  { id: 'a0000000-0000-4000-8000-000000000006', name: 'MITS Cafe', code: 'CAFE' },
  { id: 'a0000000-0000-4000-8000-000000000009', name: 'MITS Hub', code: 'HUB' },
  { id: '82433332-0436-4715-b0b3-a3b44896b39b', name: 'Happy Tea', code: 'TEA' },
  { id: 'a0000000-0000-4000-8000-000000000010', name: 'Pizza And Pasta (P2)', code: 'P2' },
  { id: 'a0000000-0000-4000-8000-000000000011', name: 'Paradise', code: 'PARA' },
  { id: 'a0000000-0000-4000-8000-000000000012', name: 'Mallikarjuna Mess', code: 'MESS' },
  { id: '702d2142-4f0a-4fa5-888d-b4f11b011f15', name: 'ACS Cafe', code: 'ACS' },
];

export const STORE_CODE_MAP: Record<string, string> = {
  MITS: 'a0000000-0000-4000-8000-000000000001',
  CANTEEN: 'a0000000-0000-4000-8000-000000000001',
  CAFE: 'a0000000-0000-4000-8000-000000000006',
  MITSCAFE: 'a0000000-0000-4000-8000-000000000006',
  HUB: 'a0000000-0000-4000-8000-000000000009',
  MITSHUB: 'a0000000-0000-4000-8000-000000000009',
  TEA: '82433332-0436-4715-b0b3-a3b44896b39b',
  HAPPY: '82433332-0436-4715-b0b3-a3b44896b39b',
  HTEA: '82433332-0436-4715-b0b3-a3b44896b39b',
  P2: 'a0000000-0000-4000-8000-000000000010',
  PIZZA: 'a0000000-0000-4000-8000-000000000010',
  PASTA: 'a0000000-0000-4000-8000-000000000010',
  PARA: 'a0000000-0000-4000-8000-000000000011',
  PARADISE: 'a0000000-0000-4000-8000-000000000011',
  MESS: 'a0000000-0000-4000-8000-000000000012',
  MALL: 'a0000000-0000-4000-8000-000000000012',
  ACS: '702d2142-4f0a-4fa5-888d-b4f11b011f15',
  ACSCAFE: '702d2142-4f0a-4fa5-888d-b4f11b011f15',
};

/**
 * Resolves a 2-8 character store code into a verified merchant outlet.
 * Returns null if the code does not exist, preserving 100% blind security.
 */
export function lookupOutletByStoreCode(
  rawCode: string, 
  availableOutlets: Array<{ id: string; name: string; code?: string }> = VENDOR_OUTLETS
): { id: string; name: string; code: string } | null {
  const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean || clean.length < 2) return null;

  // 1. Direct alias dictionary lookup
  const aliasId = STORE_CODE_MAP[clean];
  if (aliasId) {
    const match = availableOutlets.find(o => o.id === aliasId);
    if (match) return { id: match.id, name: match.name, code: clean };
  }

  // 2. Exact match on outlet code or normalized name
  for (const outlet of availableOutlets) {
    const outletCode = outlet.code?.toUpperCase();
    if (outletCode && outletCode === clean) {
      return { id: outlet.id, name: outlet.name, code: clean };
    }
    const normalizedName = outlet.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalizedName === clean) {
      return { id: outlet.id, name: outlet.name, code: clean };
    }
  }

  return null;
}
