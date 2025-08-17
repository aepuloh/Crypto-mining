// ===== Firebase Config =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Ganti dengan config Firebase kamu
const firebaseConfig = {
const firebaseConfig = {
  apiKey: "AIzaSyCc4ix1uGCaE-rsyM6Lg3jo6SzVjbXYCmw",
  authDomain: "crypto-mining-d3811.firebaseapp.com",
  projectId: "crypto-mining-d3811",
  storageBucket: "crypto-mining-d3811.firebasestorage.app",
  messagingSenderId: "1068882455445",
  appId: "1:1068882455445:web:362538bf3bb36c598f649c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const msgEl = document.getElementById("message");

document.getElementById("btnLogin").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailEl.value, passEl.value);
    msgEl.innerText = "Login berhasil ✅";
    window.location.href = "dashboard.html";
  } catch (err) {
    msgEl.innerText = "❌ " + err.message;
  }
});

document.getElementById("btnRegister").addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value);
    msgEl.innerText = "Registrasi berhasil ✅ silakan login";
  } catch (err) {
    msgEl.innerText = "❌ " + err.message;
  }
});

// Auto redirect kalau sudah login
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});
