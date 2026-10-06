/**
 * Apply supabase/add_eateries.sql statements via the Supabase REST API
 * (service role, no psql needed). Idempotent.
 *
 * Run: node supabase/apply_add_eateries.mjs
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment.');

const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const EATERIES = [
  {
    id: 'a0000000-0000-4000-8000-000000000006',
    name: 'MITS Cafe',
    image_url: '/images/shop_mits_cafe.jpg',
    latitude: 13.56102,
    longitude: 78.49781,
    location_landmark: 'Near Main Block',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000007',
    name: "Ekdant's Cafe",
    image_url: '/images/shop_ekdants_cafe.jpg',
    latitude: 13.56031,
    longitude: 78.49863,
    location_landmark: 'Beside Library',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000008',
    name: 'Lickies',
    image_url: '/images/shop_lickies.jpg',
    latitude: 13.55987,
    longitude: 78.49622,
    location_landmark: 'Opposite GATE Block',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000009',
    name: 'MITS Hub',
    image_url: '/images/shop_new_cafe.jpg',
    latitude: 13.56066,
    longitude: 78.49951,
    location_landmark: 'Near Boys Hostel',
  },
];

const OTHERS = ['Royal Hotel', 'Royal Corner', 'Chai Corner', 'Vatika Tuck', 'Lays Corner'];

async function main() {
  // 1. Upsert the 4 new eateries
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/vendors`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(EATERIES.map(e => ({ ...e, is_active: true, is_online: true, is_on_campus: true }))),
  });
  const upserted = await upsertRes.json();
  if (upsertRes.ok) {
    console.log(`✅ Upserted ${upserted.length} eateries:`, upserted.map(v => v.name).join(', '));
  } else {
    console.error('❌ Upsert failed:', JSON.stringify(upserted));
    process.exit(1);
  }

  // 2. Keep MITS Canteen active with its photo
  const canteenRes = await fetch(
    `${SUPABASE_URL}/rest/v1/vendors?id=eq.a0000000-0000-4000-8000-000000000001`,
    {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ is_active: true, image_url: '/images/shop_mits_canteen.jpg' }),
    }
  );
  console.log(canteenRes.ok ? '✅ MITS Canteen kept active' : '❌ MITS Canteen update failed');

  // 3. Park the old roster so the 5 eateries sit at the top
  const parkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/vendors?name=in.(${OTHERS.map(n => `"${n}"`).join(',')})`,
    {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ is_active: false }),
    }
  );
  console.log(parkRes.ok ? `✅ Parked old roster (${OTHERS.join(', ')})` : '❌ Parking failed');

  // 4. Verify final ordering
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/vendors?select=name,is_active&order=is_active.desc,name&limit=10`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const vendors = await verifyRes.json();
  console.log('\nFinal vendor roster:');
  for (const v of vendors) console.log(`  ${v.is_active ? '🟢' : '⚪'} ${v.name}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
