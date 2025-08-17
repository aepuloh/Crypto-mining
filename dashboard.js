import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

const $ = (id)=>document.getElementById(id);
let miningTimer = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";
  $("userEmail").textContent = user.email;
  $("userUid").textContent = user.uid;

  await ensureUserDoc(user);
  await loadDashboard(user.uid);
});

async function ensureUserDoc(user){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()){
    await setDoc(ref, {
      email: user.email,
      vipLevel: "Free",
      hashrate: 10,
      balanceBTC: 0,
      balanceUSD: 0,
      adsToday: 0,
      adsDay: todayStr(),
      updatedAt: serverTimestamp(),
    });
  }
}

async function loadDashboard(uid){
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data();

  // reset iklan harian jika beda hari
  if (d.adsDay !== todayStr()){
    await updateDoc(ref, { adsToday: 0, adsDay: todayStr(), updatedAt: serverTimestamp() });
    d.adsToday = 0; d.adsDay = todayStr();
  }

  $("vipLevel").textContent = d.vipLevel || "Free";
  $("hashrate").textContent = d.hashrate ?? 0;
  $("balanceBTC").textContent = (d.balanceBTC ?? 0).toFixed(8);
  $("balanceUSD").textContent = (d.balanceUSD ?? 0).toFixed(2);
  $("adsToday").textContent = d.adsToday ?? 0;
}

// Theme toggle
$("btnToggleTheme")?.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
});

// Mining simulation (UI-only)
$("btnStart")?.addEventListener("click", () => startMining());
$("btnStop")?.addEventListener("click", () => stopMining("Dihentikan."));

function startMining(){
  if (miningTimer) return;
  $("mineMsg").textContent = "Mining berjalan (simulasi UI).";
  let p = 0;
  miningTimer = setInterval(()=>{
    p = (p + 2) % 100;
    $("mineBar").style.width = p + "%";
  }, 200);
}
function stopMining(msg="Mining berhenti."){
  if (miningTimer){ clearInterval(miningTimer); miningTimer = null; }
  $("mineBar").style.width = "0%";
  $("mineMsg").textContent = msg;
}

// Watch Ad bonus (max 20/hari)
$("btnWatchAd")?.addEventListener("click", async ()=>{
  const u = auth.currentUser; if (!u) return;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data();

  // reset jika hari berganti
  let adsToday = d.adsToday ?? 0; let adsDay = d.adsDay ?? todayStr();
  if (adsDay !== todayStr()) { adsToday = 0; adsDay = todayStr(); }

  if (adsToday >= 20){
    $("dashMsg").textContent = "Batas iklan hari ini tercapai (20).";
    return;
  }

  // simulasi menonton iklan 3 detik
  $("dashMsg").textContent = "Menonton iklan...";
  await sleep(3000);

  const bonus = 1; // tambah 1 H/s per iklan
  const newHash = (d.hashrate ?? 0) + bonus;
  const newAds = adsToday + 1;
  await updateDoc(ref, {
    hashrate: newHash,
    adsToday: newAds,
    adsDay: todayStr(),
    updatedAt: serverTimestamp(),
  });

  $("hashrate").textContent = newHash;
  $("adsToday").textContent = newAds;
  $("dashMsg").textContent = `Iklan selesai. Hashrate +${bonus} H/s`;
});

// Logout
$("btnLogout")?.addEventListener("click", async ()=>{
  stopMining();
  await signOut(auth);
  location.href = "index.html";
});

function todayStr(){ return new Date().toISOString().slice(0,10); }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }