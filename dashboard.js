import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ===== Firebase Config (sama dengan index.js) =====
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

// ===== Layout utama =====
document.body.innerHTML = `
  <div class="flex">
    <!-- Sidebar -->
    <div id="sidebar" class="w-64 bg-gray-800 min-h-screen p-4 hidden md:block">
      <h2 class="text-xl font-bold mb-6">📊 Menu</h2>
      <ul class="space-y-3">
        <li><button class="menu-btn w-full text-left" data-page="dashboard">Dashboard</button></li>
        <li><button class="menu-btn w-full text-left" data-page="mining">Mining</button></li>
        <li><button class="menu-btn w-full text-left" data-page="profile">Profile</button></li>
        <li><button class="menu-btn w-full text-left" data-page="dompet">Dompet</button></li>
        <li><button id="logoutBtn" class="w-full text-left text-red-400">Logout</button></li>
      </ul>
    </div>

    <!-- Content -->
    <div class="flex-1 p-6">
      <button id="menuToggle" class="md:hidden bg-gray-700 px-3 py-2 rounded mb-4">☰ Menu</button>
      <div id="content" class="p-4 bg-gray-800 rounded"></div>
    </div>
  </div>
`;

// ===== Pages =====
const pages = {
  dashboard: `<h2 class="text-2xl font-bold">Selamat Datang di Dashboard 🚀</h2>`,
  mining: `
    <h2 class="text-2xl font-bold mb-4">⛏️ Mining</h2>
    <div class="space-y-4">
      <p id="hashrate">Hashrate: 45.23 H/s</p>
      <p id="mined">Total mined: 0.00000000 BTC</p>
      <div class="bg-gray-700 w-full h-3 rounded overflow-hidden">
        <div id="progress" class="bg-green-500 h-3 w-0"></div>
      </div>
      <div id="log" class="bg-black text-green-400 text-xs p-2 h-32 overflow-y-auto rounded"></div>
      <button id="startMining" class="bg-green-500 px-4 py-2 rounded">Start Mining</button>
      <button id="stopMining" class="bg-red-500 px-4 py-2 rounded hidden">Stop Mining</button>
    </div>
  `,
  profile: `<h2 class="text-2xl font-bold">👤 Profile</h2><p>Email: ${auth.currentUser?.email || ""}</p>`,
  dompet: `<h2 class="text-2xl font-bold">💰 Dompet</h2><p>Saldo: 0.00000000 BTC</p>`
};

function loadPage(page) {
  document.getElementById("content").innerHTML = pages[page];
  if (page === "mining") initMiningFeature();
}

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", () => loadPage(btn.dataset.page));
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});

// ===== Mining palsu =====
let miningInterval;
let minedAmount = 0;

function initMiningFeature() {
  const startBtn = document.getElementById("startMining");
  const stopBtn = document.getElementById("stopMining");
  const progressEl = document.getElementById("progress");
  const minedEl = document.getElementById("mined");
  const logEl = document.getElementById("log");

  function addLog(msg) {
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML += `[${time}] ${msg}<br>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  startBtn.addEventListener("click", () => {
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");
    addLog("🚀 Mining dimulai...");

    let progress = 0;

    miningInterval = setInterval(() => {
      progress += 5;
      if (progress > 100) {
        progress = 0;
        minedAmount += 0.00000050;
        minedEl.innerText = `Total mined: ${minedAmount.toFixed(8)} BTC`;
        addLog("✅ Block ditemukan! Reward 0.00000050 BTC");
      }
      progressEl.style.width = `${progress}%`;
      const fakeHash = Math.random().toString(16).substring(2, 18);
      addLog(`Mencoba hash: ${fakeHash}...`);
    }, 500);
  });

  stopBtn.addEventListener("click", () => {
    clearInterval(miningInterval);
    startBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    addLog("⛔ Mining dihentikan.");
  });
}

// ===== Logout =====
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ===== Proteksi: Kalau belum login balik ke index.html =====
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadPage("dashboard");
  }
});
