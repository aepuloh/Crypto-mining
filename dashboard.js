import { initFirebase, auth, db, onAuth, logout, startMiningLoop, clientDailyResetIfNeeded, watchAd, buyVIP2, BASE_RATE_DAY_BTC, TARGET_RATE_WITH_ADS, MAX_ADS } from './app.js';
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- UI helper
function showToast(message){
  const el = document.getElementById('toast');
  const msg = document.getElementById('toastMessage');
  msg.textContent = message;
  el.classList.add('show');
  el.classList.remove('hidden');
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.classList.add('hidden'), 300); }, 3000);
}

function startDailyResetCountdown(){
  const el = document.getElementById('dailyCountdown');
  function tick(){
    const now = new Date();
    const midnight = new Date(); midnight.setHours(24,0,0,0);
    const diff = midnight - now;
    if (diff <= 0){
      el.textContent = '⏳ Reset sedang diproses...';
      setTimeout(()=>{
        el.textContent = 'Reset dalam 24j 0m 0d';
        showToast('✅ Reset harian berhasil, iklan bisa ditonton lagi!');
      }, 1500);
      return;
    }
    const h = Math.floor(diff/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    el.textContent = `Reset dalam ${h}j ${m}m ${s}d`;
  }
  tick();
  setInterval(tick, 1000);
}

async function refreshUI(uid){
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const u = snap.data();

  document.getElementById('balanceBtc').textContent = (u.balanceBtc || 0).toFixed(8);
  document.getElementById('usdBalance').textContent = (u.usdBalance || 0).toFixed(2);
  document.getElementById('vipLevel').textContent = `VIP ${u.vipLevel || 0}`;
  document.getElementById('rateDay').textContent = (u.miningRatePerDayBtc || BASE_RATE_DAY_BTC).toFixed(8);
  document.getElementById('adsToday').textContent = `${u.adsWatchedToday || 0}/${MAX_ADS}`;
}

function liveBind(uid){
  const ref = doc(db, 'users', uid);
  return onSnapshot(ref, (snap)=>{
    if (!snap.exists()) return;
    const u = snap.data();
    document.getElementById('balanceBtc').textContent = (u.balanceBtc || 0).toFixed(8);
    document.getElementById('usdBalance').textContent = (u.usdBalance || 0).toFixed(2);
    document.getElementById('vipLevel').textContent = `VIP ${u.vipLevel || 0}`;
    document.getElementById('rateDay').textContent = (u.miningRatePerDayBtc || BASE_RATE_DAY_BTC).toFixed(8);
    document.getElementById('adsToday').textContent = `${u.adsWatchedToday || 0}/${MAX_ADS}`;
  });
}

// --- main
initFirebase();

document.getElementById('logoutBtn').onclick = logout;
document.getElementById('watchAdBtn').onclick = async ()=>{
  const user = auth.currentUser;
  if (!user) return;
  try{
    const res = await watchAd(user.uid);
    showToast(`🎥 Iklan ke-${res.watched}. Rate: ${(res.newRate).toFixed(8)} BTC/hari`);
  }catch(e){
    showToast('❌ ' + (e?.message||e));
  }
};
document.getElementById('buyVip2Btn').onclick = async ()=>{
  const user = auth.currentUser;
  if (!user) return;
  try{
    const { end } = await buyVIP2(user.uid);
    const d = new Date(end);
    showToast(`💎 VIP2 aktif s.d. ${d.toLocaleString()}`);
  }catch(e){
    showToast('❌ ' + (e?.message||e));
  }
};

let unsub = null;

onAuth(async (user)=>{
  if (!user){
    // redirect sederhana
    window.location.href = './index.html';
    return;
  }
  await clientDailyResetIfNeeded(user.uid);
  await refreshUI(user.uid);
  if (unsub) unsub(); // cleanup
  unsub = liveBind(user.uid);
  startDailyResetCountdown();
  startMiningLoop(user.uid);
});
