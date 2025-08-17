import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

const el = (id) => document.getElementById(id);
const authMsg = el("authMsg");

// Tabs
const tabLogin = el("tabLogin");
const tabRegister = el("tabRegister");
const loginPane = el("loginPane");
const registerPane = el("registerPane");

function showTab(tab) {
  if (tab === "login") {
    loginPane.classList.add("shown");
    registerPane.classList.remove("shown");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
  } else {
    registerPane.classList.add("shown");
    loginPane.classList.remove("shown");
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
  }
}

tabLogin?.addEventListener("click", () => showTab("login"));
tabRegister?.addEventListener("click", () => showTab("register"));

// Auth handlers
el("btnLogin")?.addEventListener("click", async () => {
  const email = el("loginEmail").value.trim();
  const pass = el("loginPassword").value;
  if (!email || !pass) return toast("Isi email & password");
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = "dashboard.html";
  } catch (e) { toast(parseError(e)); }
});

el("btnRegister")?.addEventListener("click", async () => {
  const email = el("regEmail").value.trim();
  const pass = el("regPassword").value;
  if (!email || pass.length < 6) return toast("Password minimal 6 karakter");
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // buat dokumen user awal
    const ref = doc(db, "users", cred.user.uid);
    await setDoc(ref, {
      email,
      vipLevel: "Free",
      hashrate: 10, // default
      balanceBTC: 0,
      balanceUSD: 0,
      adsToday: 0,
      adsDay: todayStr(),
      updatedAt: serverTimestamp(),
    });
    location.href = "dashboard.html";
  } catch (e) { toast(parseError(e)); }
});

onAuthStateChanged(auth, (u) => {
  // kalau sudah login dan ada di halaman ini, langsung ke dashboard
  if (u) location.href = "dashboard.html";
});

function toast(msg){ authMsg.textContent = msg; }
function parseError(e){
  const m = e?.message || String(e);
  if (m.includes("auth/invalid-credential")) return "Email atau password salah";
  if (m.includes("auth/email-already-in-use")) return "Email sudah terdaftar";
  return m;
}
function todayStr(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}