// Firebase v10 CDN imports (ES modules)
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ====== KONSTANTA BISNIS ======
export const BASE_RATE_DAY_BTC = 0.001;           // gratis: 0.001 BTC/hari
export const MAX_ADS = 20;                        // iklan per hari
export const TARGET_RATE_WITH_ADS = 0.002;        // target setelah 20 iklan
export const BONUS_PER_AD_DAY_BTC = (TARGET_RATE_WITH_ADS - BASE_RATE_DAY_BTC) / MAX_ADS; // 0.00005 BTC/hari per iklan
export const VIP2_RATE_DAY_BTC = 0.003;           // contoh rate VIP2
export const VIP2_PRICE_USD = 5;                  // biaya VIP2
export const VIP2_DAYS = 6;                       // masa kontrak hari

// ====== STATE SINGLETON ======
export let app, auth, db;
let miningTimer = null;

// ====== INIT FIREBASE (panggil sekali dari halaman pertama) ======
export function initFirebase() {
  if (!getApps().length) {
    app  = initializeApp(firebaseConfig);
  }
  // bisa dipanggil berkali2 aman
  auth = getAuth();
  db   = getFirestore();
}

// ====== AUTH ======
export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // inisialisasi dokumen user
  const ref = doc(db, "users", cred.user.uid);
  await setDoc(ref, {
    uid: cred.user.uid,
    email,
    balanceBtc: 0,
    usdBalance: 0,
    vipLevel: 0,
    miningRatePerDayBtc: BASE_RATE_DAY_BTC,
    adsWatchedToday: 0,
    lastAdWatchDate: new Date().toDateString(),
    miningStart: null,        // ms timestamp
    vipContractEnd: null,     // ms timestamp
    createdAt: serverTimestamp()
  });
  return cred;
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() { return signOut(auth); }

// ====== LISTENER LOGIN (opsional dipakai di dashboard.js) ======
export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

// ====== MINING ENGINE (simulasi akumulasi BTC per detik) ======
export async function startMiningLoop(uid) {
  stopMiningLoop(); // clear sebelumnya
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  let u = snap.data();

  // jika belum ada start, set sekarang
  if (!u.miningStart) {
    await updateDoc(ref, { miningStart: Date.now() });
    u.miningStart = Date.now();
  }

  miningTimer = setInterval(async () => {
    // cek 24 jam
    const elapsed = (Date.now() - u.miningStart) / 1000; // detik
    if (elapsed >= 86400) {
      stopMiningLoop();
      await updateDoc(ref, { miningStart: null });
      return;
    }

    // hitung pendapatan per detik
    const perSec = (u.miningRatePerDayBtc || BASE_RATE_DAY_BTC) / 86400;
    u.balanceBtc = (u.balanceBtc || 0) + perSec;
    await updateDoc(ref, { balanceBtc: u.balanceBtc });
  }, 1000);
}

export function stopMiningLoop() {
  if (miningTimer) clearInterval(miningTimer);
  miningTimer = null;
}

// ====== IKLAN (hanya VIP0 yang bisa boost rate) ======
export async function watchAd(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  const u = snap.data();

  if (u.vipLevel !== 0) throw new Error("Iklan hanya untuk VIP 0");
  if ((u.adsWatchedToday || 0) >= MAX_ADS) throw new Error("Batas iklan hari ini sudah 20");

  const watched = (u.adsWatchedToday || 0) + 1;
  // rate = base + watched * bonus; cap ke TARGET_RATE_WITH_ADS
  let newRate = BASE_RATE_DAY_BTC + watched * BONUS_PER_AD_DAY_BTC;
  if (newRate > TARGET_RATE_WITH_ADS) newRate = TARGET_RATE_WITH_ADS;

  await updateDoc(ref, {
    adsWatchedToday: watched,
    miningRatePerDayBtc: newRate,
    lastAdWatchDate: new Date().toDateString()
  });

  return { watched, newRate };
}

// ====== BELI VIP2 (pakai USD balance) ======
export async function buyVIP2(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  const u = snap.data();

  if ((u.usdBalance || 0) < VIP2_PRICE_USD) throw new Error("Saldo USD tidak cukup ($5)");
  const end = Date.now() + VIP2_DAYS * 24 * 60 * 60 * 1000;

  await updateDoc(ref, {
    usdBalance: (u.usdBalance || 0) - VIP2_PRICE_USD,
    vipLevel: 2,
    vipContractEnd: end,
    miningRatePerDayBtc: VIP2_RATE_DAY_BTC
  });

  return { end };
}

// ====== RESET HARIAN (dipakai client saat buka dashboard) ======
export async function clientDailyResetIfNeeded(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const u = snap.data();

  const today = new Date().toDateString();
  if (u.lastAdWatchDate !== today) {
    // jika VIP2 masih aktif → gunakan VIP2 rate, kalau tidak → base
    let rate = BASE_RATE_DAY_BTC;
    if (u.vipLevel === 2 && u.vipContractEnd && Date.now() < u.vipContractEnd) {
      rate = VIP2_RATE_DAY_BTC;
    }
    await updateDoc(ref, {
      adsWatchedToday: 0,
      miningRatePerDayBtc: rate,
      lastAdWatchDate: today
    });
  }

  // jika VIP2 sudah habis, turunkan rate ke base dan vipLevel ke 0
  if (u.vipLevel === 2 && u.vipContractEnd && Date.now() >= u.vipContractEnd) {
    await updateDoc(ref, {
      vipLevel: 0,
      vipContractEnd: null,
      miningRatePerDayBtc: BASE_RATE_DAY_BTC
    });
  }
}
