import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const hashrateInput = document.getElementById("hashrate");
const coinSelect = document.getElementById("coin");
const durationInput = document.getElementById("duration");
const totalCoins = document.getElementById("totalCoins");

let miningInterval;
let total = 0;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmail.textContent = user.email;
  } else {
    window.location.href = "index.html";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

startBtn.addEventListener("click", () => {
  clearInterval(miningInterval);
  miningInterval = setInterval(() => {
    let rate = parseFloat(hashrateInput.value) || 0;
    total += rate / 1000000;
    totalCoins.textContent = total.toFixed(8);
  }, 1000);
});

stopBtn.addEventListener("click", () => {
  clearInterval(miningInterval);
});

resetBtn.addEventListener("click", () => {
  clearInterval(miningInterval);
  total = 0;
  totalCoins.textContent = "0.00000000";
});