import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const coinCount = document.getElementById("coinCount");
const progressFill = document.getElementById("progressFill");
const durationSelect = document.getElementById("durationSelect");

let coins = 0;
let mining = false;
let timer, progressTimer;
let totalTime = 10;
let elapsedTime = 0;

startBtn.addEventListener("click", () => {
  if (mining) return;
  mining = true;

  totalTime = parseInt(durationSelect.value);
  elapsedTime = 0;
  progressFill.style.width = "0%";

  timer = setInterval(() => {
    coins++;
    coinCount.textContent = coins;

    coinCount.classList.add("coin-bounce");
    setTimeout(() => coinCount.classList.remove("coin-bounce"), 300);
  }, 1000);

  progressTimer = setInterval(() => {
    elapsedTime++;
    let progress = (elapsedTime / totalTime) * 100;
    progressFill.style.width = progress + "%";

    if (elapsedTime >= totalTime) {
      clearInterval(timer);
      clearInterval(progressTimer);
      mining = false;
    }
  }, 1000);
});

stopBtn.addEventListener("click", () => {
  clearInterval(timer);
  clearInterval(progressTimer);
  mining = false;
});

resetBtn.addEventListener("click", () => {
  clearInterval(timer);
  clearInterval(progressTimer);
  coins = 0;
  elapsedTime = 0;
  mining = false;
  coinCount.textContent = coins;
  progressFill.style.width = "0%";
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

onAuthStateChanged(auth, (u) => {
  if (!u || !u.emailVerified) {
    window.location.href = "index.html";
  }
});