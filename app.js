// app.js - core logic (init, auth, mining simulation, ads, vip)
// NOTE: requires firebase-config.js in same folder (with firebaseConfig & ADMIN_UIDS)
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig, ADMIN_UIDS } from "./firebase-config.js";

// Business constants
export const BASE_RATE_DAY_BTC = 0.001;            // base BTC / day
export const MAX_ADS = 20;
export const TARGET_RATE_WITH_ADS = 0.002;         // after 20 ads
export const BONUS_PER_AD_DAY_BTC = (TARGET_RATE_WITH_ADS - BASE_RATE_DAY_BTC) / MAX_ADS;
export const VIP2_PRICE_USD = 5;
export const VIP2_DAYS = 6;
export const VIP2_RATE_DAY_BTC = 0.003;

// Singletons
export let app = null, auth = null, db = null;
let miningInterval = null;

// init firebase (call once)
export function initFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  // re-get services
  auth = getAuth();
  db = getFirestore();
}

// --------- Auth funcs ---------
export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(getAuth(), email, password);
  const ref = doc(getFirestore(), "users", cred.user.uid);
  await setDoc(ref, {
    uid: cred.user.uid,
    email,
    balanceBtc: 0,
    usdBalance: 0,
    vipLevel: 0,
    miningRatePerDayBtc: BASE_RATE_DAY_BTC,
    adsWatchedToday: 0,
    lastAdWatchDate: new Date().toDateString(),
    miningStart: null,
    vipContractEnd: null,
    createdAt: serverTimestamp()
  });
  return cred;
}

export function login(email, password) {
  return signInWithEmailAndPassword(getAuth(), email, password);
}

export function logout() {
  return signOut(getAuth());
}

// onAuth: wrapper for page listeners
export function onAuth(cb) {
  return onAuthStateChanged(getAuth(), cb);
}

// --------- Mining loop (simulation) ---------
// start mining loop for a given uid (client-side simulation which updates Firestore)
export async function startMiningLoop(uid) {
  stopMiningLoop();
  const ref = doc(getFirestore(), "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  let u = snap.data();

  // set miningStart if null
  if (!u.miningStart) {
    await updateDoc(ref, { miningStart: Date.now() });
    u.miningStart = Date.now();
  }

  miningInterval = setInterval(async () => {
    const s = await getDoc(ref);
    if (!s.exists()) { stopMiningLoop(); return; }
    const user = s.data();

    // check if 24h passed since miningStart
    if (!user.miningStart) {
      // no active mining session
      return;
    }
    const elapsed = (Date.now() - user.miningStart) / 1000; // seconds
    if (elapsed >= 86400) {
      // stop session automatically (client marks miningStart null)
      await updateDoc(ref, { miningStart: null });
      stopMiningLoop();
      return;
    }

    // add per-second earnings
    const perSec = (user.miningRatePerDayBtc || BASE_RATE_DAY_BTC) / 86400;
    const newBal = (user.balanceBtc || 0) + perSec;
    await updateDoc(ref, { balanceBtc: newBal });
  }, 1000);
}

export function stopMiningLoop() {
  if (miningInterval) clearInterval(miningInterval);
  miningInterval = null;
}

// --------- Ads & VIP ---------
export async function watchAd(uid) {
  const ref = doc(getFirestore(), "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  const u = snap.data();
  if (u.vipLevel && u.vipLevel !== 0) throw new Error("Ads only for VIP 0 users");
  if ((u.adsWatchedToday || 0) >= MAX_ADS) throw new Error("Limit ads reached today");

  const watched = (u.adsWatchedToday || 0) + 1;
  let newRate = BASE_RATE_DAY_BTC + watched * BONUS_PER_AD_DAY_BTC;
  if (newRate > TARGET_RATE_WITH_ADS) newRate = TARGET_RATE_WITH_ADS;

  await updateDoc(ref, {
    adsWatchedToday: watched,
    miningRatePerDayBtc: newRate,
    lastAdWatchDate: new Date().toDateString()
  });
  return { watched, newRate };
}

export async function buyVIP2(uid) {
  const ref = doc(getFirestore(), "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  const u = snap.data();
  if ((u.usdBalance || 0) < VIP2_PRICE_USD) throw new Error("Insufficient USD balance");

  const end = Date.now() + VIP2_DAYS * 24 * 60 * 60 * 1000;
  await updateDoc(ref, {
    usdBalance: (u.usdBalance || 0) - VIP2_PRICE_USD,
    vipLevel: 2,
    vipContractEnd: end,
    miningRatePerDayBtc: VIP2_RATE_DAY_BTC
  });
  return { end };
}

// client-side daily reset (fallback if no server cron)
export async function clientDailyResetIfNeeded(uid) {
  const ref = doc(getFirestore(), "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const u = snap.data();
  const today = new Date().toDateString();

  if (u.lastAdWatchDate !== today) {
    // if VIP2 active, preserve; else base rate
    let base = BASE_RATE_DAY_BTC;
    if (u.vipLevel === 2 && u.vipContractEnd && Date.now() < u.vipContractEnd) {
      base = (u.miningRatePerDayBtc || VIP2_RATE_DAY_BTC);
    }
    await updateDoc(ref, {
      adsWatchedToday: 0,
      miningRatePerDayBtc: base,
      lastAdWatchDate: today
    });
  }

  // if VIP2 expired, drop
  if (u.vipLevel === 2 && u.vipContractEnd && Date.now() >= u.vipContractEnd) {
    await updateDoc(ref, {
      vipLevel: 0,
      vipContractEnd: null,
      miningRatePerDayBtc: BASE_RATE_DAY_BTC
    });
  }
}
