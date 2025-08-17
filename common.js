import { auth, db, ADMIN_UIDS, GST_RATE_USD, MAX_ADS_PER_DAY, QRIS_IMAGE } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';

export const $ = id => document.getElementById(id);
export const todayStr = ()=> new Date().toISOString().slice(0,10);

// Mount navbar and menu logic (dynamic admin link)
export function mountNavbar(){
  const nav = document.getElementById('navbar'); if(!nav) return;
  nav.className='nav';
  nav.innerHTML = `
    <div class="brand">Crypto Mining (GST)</div>
    <div class="dropdown" id="dd">
      <button class="dropbtn" id="btnMenu">⋮</button>
      <div class="dropdown-content" id="menuContent">
        <a href="dashboard.html">Dashboard</a>
        <a href="profile.html">Profile</a>
        <a href="convert.html">Konversi</a>
        <a id="menuDeposit" href="dashboard.html#deposit">Deposit</a>
        <!-- admin link injected -->
        <button id="btnLogout" class="danger">Logout</button>
      </div>
    </div>`;

  const dd = $('dd');
  $('btnMenu').addEventListener('click', ()=> dd.classList.toggle('open'));
  document.addEventListener('click', e=>{ if(!dd.contains(e.target)) dd.classList.remove('open'); });
  $('btnLogout').addEventListener('click', async ()=>{ await signOut(auth); location.href='index.html'; });
}

// Guard: ensure auth and user doc; also inject admin menu if admin
export function guardAndInit(callback){
  mountNavbar();
  onAuthStateChanged(auth, async (user)=>{
    if(!user) return location.href='index.html';
    // ensure user doc exists
    const uRef = doc(db,'users',user.uid);
    const uSnap = await getDoc(uRef);
    if(!uSnap.exists()){
      await setDoc(uRef, {
        email: user.email,
        vipLevel: 0,
        vip1ExpiresAt: null,
        gstBalance: 0,
        usdBalance: 0,
        adsToday: 0,
        adsDay: todayStr(),
        lastAccrualAt: Date.now(),
        updatedAt: serverTimestamp()
      });
    }
    // admin menu
    if(ADMIN_UIDS.includes(user.uid)){
      const menu = document.getElementById('menuContent');
      const a = document.createElement('a'); a.href='admin.html'; a.textContent='Admin Panel';
      menu.insertBefore(a, document.getElementById('btnLogout'));
    }
    // save last user info in session for pages
    sessionStorage.setItem('lastUser', JSON.stringify({uid:user.uid,email:user.email}));
    // accrue earnings when user opens page
    await accrueEarnings(user.uid);
    callback && callback(user);
  });
}

export async function getUserData(uid){
  const ref = doc(db,'users',uid);
  const snap = await getDoc(ref);
  return { ref, data: snap.exists() ? snap.data() : null };
}

export function isVip1Active(userData){
  return userData && userData.vipLevel===1 && userData.vip1ExpiresAt && Date.now() < userData.vip1ExpiresAt;
}

export function currentDailyRateGST(userData){
  if(!userData) return 0;
  if(isVip1Active(userData)) return 100;
  const ads = (userData.adsDay === todayStr()) ? Math.min(userData.adsToday||0, MAX_ADS_PER_DAY) : 0;
  return 20 + ads; // VIP0 base 20
}

// Accrue offline: berdasarkan lastAccrualAt timestamp
export async function accrueEarnings(uid){
  const { ref, data } = await getUserData(uid);
  if(!data) return;
  const now = Date.now();
  const last = data.lastAccrualAt || now;
  if(now <= last) return;
  const daily = currentDailyRateGST(data); // GST/day
  const earned = (daily/86400000) * (now - last); // proportional
  if(earned <= 0) return;
  await updateDoc(ref, { gstBalance: (data.gstBalance||0) + earned, lastAccrualAt: now, updatedAt: serverTimestamp() });
}

// Watch ad: adds to adsToday (only affects daily rate)
export async function watchAd(uid){
  const { ref, data } = await getUserData(uid);
  if(!data) throw new Error('User not found');
  const isToday = data.adsDay === todayStr();
  const todayCount = isToday ? (data.adsToday||0) : 0;
  if(todayCount >= MAX_ADS_PER_DAY) throw new Error('Batas iklan hari ini tercapai');
  await updateDoc(ref, { adsToday: todayCount+1, adsDay: todayStr(), updatedAt: serverTimestamp() });
}

// Buy VIP1: charge usdBalance $5 and set vip1ExpiresAt
export async function buyVIP1(uid){
  const { ref, data } = await getUserData(uid);
  if(!data) throw new Error('User not found');
  if((data.usdBalance||0) < 5) throw new Error('Saldo USD tidak cukup ($5)');
  const end = Date.now() + 7*24*60*60*1000;
  await updateDoc(ref, { usdBalance: (data.usdBalance||0) - 5, vipLevel: 1, vip1ExpiresAt: end, updatedAt: serverTimestamp() });
}

// Submit deposit request: create doc in collection deposits
export async function submitDepositRequest(uid, amountUsd, proof){
  const payload = {
    uid, amountUsd, proof, status: 'pending', requestedAt: serverTimestamp()
  };
  await addDoc(collection(db,'deposits'), payload);
}

// Admin: fetch deposit requests (pending)
export async function fetchPendingDeposits(){
  const q = query(collection(db,'deposits'), where('status','==','pending'), orderBy('requestedAt','desc'));
  const snap = await getDocs(q); return snap.docs.map(d=>({id:d.id,...d.data()}));
}

// Admin confirm deposit: set status=confirmed and top-up user's usdBalance
export async function adminConfirmDeposit(depositId, targetUid, amountUsd){
  const depRef = doc(db,'deposits',depositId);
  const userRef = doc(db,'users',targetUid);
  await updateDoc(depRef, { status:'confirmed', confirmedAt: serverTimestamp() });
  const userSnap = await getDoc(userRef);
  if(userSnap.exists()){
    const d = userSnap.data();
    await updateDoc(userRef, { usdBalance: (d.usdBalance||0) + amountUsd, updatedAt: serverTimestamp() });
  }
}

export { GST_RATE_USD };