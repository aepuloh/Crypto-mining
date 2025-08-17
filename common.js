import { auth, db, ADMIN_UIDS, GST_RATE_USD, MAX_ADS_PER_DAY } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

export const $ = (id)=>document.getElementById(id);
export const todayStr = ()=> new Date().toISOString().slice(0,10);

// ===== Navbar builder (3 titik) + guard login =====
export function mountNavbar(){
  const nav = document.getElementById("navbar");
  if (!nav) return;
  nav.className = "nav";
  nav.innerHTML = `
    <div class="brand">Crypto Mining (GST)</div>
    <div class="dropdown" id="dd">
      <button class="dropbtn" id="btnMenu">⋮</button>
      <div class="dropdown-content" id="menuContent">
        <a href="dashboard.html">Dashboard</a>
        <a href="profile.html">Profile</a>
        <a href="convert.html">Konversi</a>
        <!-- Admin link injected by JS -->
        <button id="btnLogout" class="danger">Logout</button>
      </div>
    </div>`;

  const dd = $("dd");
  $("btnMenu").addEventListener('click', ()=> dd.classList.toggle('open'));
  document.addEventListener('click', (e)=>{ if(!dd.contains(e.target)) dd.classList.remove('open'); });

  $("btnLogout").addEventListener('click', async ()=>{ await signOut(auth); location.href = 'index.html'; });
}

export function guardAndInit(callback){
  mountNavbar();
  onAuthStateChanged(auth, async (user)=>{
    if (!user) return location.href = 'index.html';
    await ensureUserDoc(user);
    // tampilkan admin menu jika admin
    if (ADMIN_UIDS.includes(user.uid)){
      const menu = document.getElementById('menuContent');
      const a = document.createElement('a'); a.href = 'admin.html'; a.textContent = 'Admin Panel';
      menu.insertBefore(a, document.getElementById('btnLogout'));
    }
    // auto accrual saat halaman terbuka
    await accrueEarnings(user.uid);
    callback && callback(user);
  });
}

// ===== User doc helpers =====
async function ensureUserDoc(user){
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()){
    await setDoc(ref, {
      email: user.email,
      vipLevel: 0,
      vip1ExpiresAt: null, // timestamp (ms) jika aktif
      gstBalance: 0,
      usdBalance: 0,
      adsToday: 0,
      adsDay: todayStr(),
      lastAccrualAt: Date.now(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getUserData(uid){
  const ref = doc(db, 'users', uid); const snap = await getDoc(ref);
  return { ref, data: snap.data() };
}

export function currentDailyRateGST(userData){
  // VIP1 aktif?
  const now = Date.now();
  const vipActive = userData.vipLevel === 1 && userData.vip1ExpiresAt && now < userData.vip1ExpiresAt;
  if (vipActive) return 100;
  // VIP0: 20 + bonus iklan (max 20)
  const adsDay = userData.adsDay || todayStr();
  const ads = (adsDay === todayStr()) ? Math.min(userData.adsToday||0, MAX_ADS_PER_DAY) : 0;
  return 20 + ads; // max 40
}

// Accrual earnings sejak lastAccrualAt → tambah ke gstBalance
export async function accrueEarnings(uid){
  const { ref, data } = await getUserData(uid);
  if (!data) return;
  const now = Date.now();
  const last = data.lastAccrualAt || now;
  const daily = currentDailyRateGST(data); // GST per day
  const earned = (daily/86400000) * Math.max(0, now - last);
  if (earned <= 0) return;
  await updateDoc(ref, { gstBalance: (data.gstBalance||0) + earned, lastAccrualAt: now, updatedAt: serverTimestamp() });
}

// Watch Ad (VIP0 saja menambah rate harian)
export async function watchAd(uid){
  const { ref, data } = await getUserData(uid);
  const isToday = (data.adsDay === todayStr());
  const todayCount = isToday ? (data.adsToday||0) : 0;
  if (todayCount >= MAX_ADS_PER_DAY) throw new Error('Batas iklan hari ini tercapai');
  await updateDoc(ref, {
    adsToday: todayCount + 1,
    adsDay: todayStr(),
    updatedAt: serverTimestamp(),
  });
}

// Buy VIP1 ($5, 7 hari). Potong usdBalance.
export async function buyVIP1(uid){
  const { ref, data } = await getUserData(uid);
  if ((data.usdBalance||0) < 5) throw new Error('Saldo USD tidak cukup ($5)');
  const end = Date.now() + 7*24*60*60*1000; // 7 hari
  await updateDoc(ref, {
    usdBalance: (data.usdBalance||0) - 5,
    vipLevel: 1,
    vip1ExpiresAt: end,
    updatedAt: serverTimestamp(),
  });
}

export { GST_RATE_USD };