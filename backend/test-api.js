const API_URL = 'http://localhost:3000/api';
let passed = 0, failed = 0;

function ok(label, condition, extra = '') {
  if (condition) { console.log(`  ✅ ${label}${extra ? ' — ' + extra : ''}`); passed++; }
  else           { console.log(`  ❌ FAIL: ${label}${extra ? ' — ' + extra : ''}`); failed++; }
}

async function api(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function devLogin(phone, role) {
  const { status, data } = await api('POST', '/auth/dev-login', { phone, role });
  if (status !== 200) throw new Error(`Dev login failed for ${phone}: ${JSON.stringify(data)}`);
  return data.token;
}

async function setProfile(token, name, role) {
  await api('POST', '/auth/profile', { name, primaryRole: role, roles: [role] }, token);
}

async function run() {
  console.log('\n🍽️  FoodShare API — End-to-End Test Suite\n' + '='.repeat(50));

  // ── 1. AUTH ──────────────────────────────────────────────────
  console.log('\n📋  [1] Auth Flow');
  const donorToken   = await devLogin('+911111111101', 'donor');
  const receiverToken= await devLogin('+911111111102', 'receiver');
  const courierToken = await devLogin('+911111111103', 'courier');
  await setProfile(donorToken,    'Test Donor',    'donor');
  await setProfile(receiverToken, 'Test Receiver', 'receiver');
  await setProfile(courierToken,  'Test Courier',  'courier');

  const { status: meStatus, data: meData } = await api('GET', '/auth/me', null, donorToken);
  ok('GET /auth/me', meStatus === 200 && meData.name === 'Test Donor');

  // ── 2. LISTINGS ───────────────────────────────────────────────
  console.log('\n📋  [2] Donor — Create Listing');
  const pickupStart = new Date().toISOString();
  const pickupEnd   = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // 3h from now

  const { status: createStatus, data: createData } = await api('POST', '/listings', {
    title: 'Biryani & Dal — Test',
    description: 'Leftover from corporate event',
    foodType: 'non_veg',
    quantityText: '30 servings',
    quantityNum: 30,
    addressText: 'Kothrud, Pune',
    latitude: 18.5362,
    longitude: 73.8151,
    pickupStart,
    pickupEnd,
    requiresColdChain: false,
    needsCourier: true,
  }, donorToken);
  ok('POST /listings (create)', createStatus === 201, `id=${createData.listing?.id}`);
  const listingId = createData.listing?.id;

  // Get listing detail
  const { status: getOneStatus, data: getOneData } = await api('GET', `/listings/${listingId}`, null, donorToken);
  ok('GET /listings/:id', getOneStatus === 200 && getOneData.listing?.title === 'Biryani & Dal — Test');

  // Nearby listings
  const { status: nearbyStatus, data: nearbyData } = await api('GET', '/listings?lat=18.5362&lng=73.8151&radius=10000', null, receiverToken);
  ok('GET /listings (nearby)', nearbyStatus === 200);
  ok('Nearby listings non-empty', nearbyData.listings?.length > 0, `found ${nearbyData.listings?.length}`);

  // My listings
  const { status: myListStatus, data: myListData } = await api('GET', '/listings/my', null, donorToken);
  ok('GET /listings/my', myListStatus === 200 && myListData.listings?.length > 0);

  // ── 3. CLAIMS ─────────────────────────────────────────────────
  console.log('\n📋  [3] Receiver — Claim Flow');

  // Claim should fail: 'receiver' role check
  const { status: claimStatus, data: claimData } = await api('POST', `/listings/${listingId}/claim`, {}, receiverToken);
  ok('POST /listings/:id/claim', claimStatus === 201, `claimId=${claimData.claim?.id}`);
  const claimId = claimData.claim?.id;

  // Double-claim should fail
  const { status: doubleClaimStatus } = await api('POST', `/listings/${listingId}/claim`, {}, receiverToken);
  ok('Double-claim blocked (409)', doubleClaimStatus === 409);

  // My claims
  const { status: myClaimsStatus } = await api('GET', '/claims/my', null, receiverToken);
  ok('GET /claims/my', myClaimsStatus === 200);

  // ── 4. COURIER JOBS ───────────────────────────────────────────
  console.log('\n📋  [4] Courier — Job Board Flow');
  const { status: jobsStatus, data: jobsData } = await api('GET', '/courier/jobs?lat=18.5362&lng=73.8151&radius=10000', null, courierToken);
  ok('GET /courier/jobs', jobsStatus === 200);
  ok('Courier jobs non-empty', jobsData.jobs?.length > 0, `found ${jobsData.jobs?.length}`);
  const jobId = jobsData.jobs?.[0]?.id;

  // Accept job
  const { status: acceptStatus } = await api('POST', `/courier/jobs/${jobId}/accept`, {}, courierToken);
  ok('POST /courier/jobs/:id/accept', acceptStatus === 200);

  // Double-accept blocked
  const { status: doubleAccept } = await api('POST', `/courier/jobs/${jobId}/accept`, {}, courierToken);
  ok('Double-accept blocked (409)', doubleAccept === 409);

  // Picked up
  const { status: pickedStatus } = await api('PATCH', `/courier/jobs/${jobId}/picked-up`, {}, courierToken);
  ok('PATCH /courier/jobs/:id/picked-up', pickedStatus === 200);

  // Delivered
  const { status: deliveredStatus, data: deliveredData } = await api('PATCH', `/courier/jobs/${jobId}/delivered`, {}, courierToken);
  ok('PATCH /courier/jobs/:id/delivered', deliveredStatus === 200);
  ok('Points awarded on delivery', deliveredData.pointsAwarded === 10);

  // My courier jobs history
  const { status: myJobsStatus, data: myJobsData } = await api('GET', '/courier/jobs/my', null, courierToken);
  ok('GET /courier/jobs/my', myJobsStatus === 200);
  ok('Courier impact points updated', myJobsData.totalPoints >= 10);

  // ── 5. RATINGS ────────────────────────────────────────────────
  console.log('\n📋  [5] Ratings');
  const { data: receiverMe } = await api('GET', '/auth/me', null, receiverToken);
  const { status: rateStatus } = await api('POST', '/ratings', {
    listingId, ratedId: receiverMe.id, score: 5, comment: 'Very reliable receiver!'
  }, donorToken);
  ok('POST /ratings', rateStatus === 201);

  // Duplicate rating blocked
  const { status: dupRateStatus } = await api('POST', '/ratings', {
    listingId, ratedId: receiverMe.id, score: 3
  }, donorToken);
  ok('Duplicate rating blocked (409)', dupRateStatus === 409);

  // ── 6. NOTIFICATIONS ─────────────────────────────────────────
  console.log('\n📋  [6] Notifications');
  const { status: notifStatus, data: notifData } = await api('GET', '/notifications', null, donorToken);
  ok('GET /notifications', notifStatus === 200);

  // ── SUMMARY ───────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n' + '='.repeat(50));
  console.log(`\n🏁  Results: ${passed}/${total} passed — ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error('\n💥 Unhandled error:', err.message); process.exit(1); });
