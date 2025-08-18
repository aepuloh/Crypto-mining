let mining = false;
let rate = 0;
let balance = 0;
let miningInterval;
let vipLevel = 0;

// === AUTH ===
function login() {
  window.location.href = "dashboard.html"; // langsung masuk (belum pakai backend)
}

function register() {
  alert("Registrasi berhasil! Silakan login.");
}

// === MINING ===
function startMining() {
  if (mining) return;
  mining = true;
  if (rate === 0) rate = 20; // default VIP0
  document.getElementById("status").innerText = "Mining...";
  document.getElementById("rate").innerText = rate;

  miningInterval = setInterval(() => {
    balance += rate / 24 / 60; // tiap menit nambah sesuai rate/day
    document.getElementById("balance").innerText = balance.toFixed(2);
  }, 60000); // 1 menit
}

function stopMining() {
  mining = false;
  document.getElementById("status").innerText = "Idle";
  clearInterval(miningInterval);
}

// === IKLAN & VIP ===
function watchAd() {
  if (vipLevel === 0 && rate < 40) {
    rate += 1;
    document.getElementById("rate").innerText = rate;
    alert("Rate bertambah +1 GST/day!");
  } else {
    alert("Max iklan tercapai atau sudah VIP!");
  }
}

function upgradeVip() {
  vipLevel = 1;
  rate = 100;
  document.getElementById("vipLevel").innerText = "VIP 1";
  document.getElementById("rate").innerText = rate;
  alert("Upgrade ke VIP1 berhasil! Rate mining sekarang 100 GST/day");
}