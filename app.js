let user = JSON.parse(localStorage.getItem("gstUser")) || null;
let miningInterval = null;

function saveUser() {
  localStorage.setItem("gstUser", JSON.stringify(user));
}

function registerUser() {
  const username = document.getElementById("username").value.trim();
  const referral = document.getElementById("referral").value.trim();
  if (!username) return alert("Masukkan username");

  user = {
    name: username,
    balance: 0,
    rate: 5,
    vip: 0,
    referralCode: username + Math.floor(Math.random()*1000),
    team: [],
    adsUsed: 0
  };

  if (referral) {
    user.team.push("Referred by " + referral);
  }

  saveUser();
  loadDashboard();
  showPage("dashboardPage");
}

function loadDashboard() {
  if (!user) return;
  document.getElementById("welcomeUser").textContent = "Hi, " + user.name;
  document.getElementById("balance").textContent = user.balance.toFixed(2);
  document.getElementById("walletBalance").textContent = user.balance.toFixed(2);
  document.getElementById("rate").textContent = user.rate;
  document.getElementById("vipLevel").textContent = user.vip;
  document.getElementById("myReferral").textContent = user.referralCode;
  document.getElementById("adsUsed").textContent = user.adsUsed;
  updateHistory();
}

function startMining() {
  if (miningInterval) return alert("Mining sudah berjalan");
  miningInterval = setInterval(() => {
    user.balance += user.rate/8640; // tiap 10 detik = 1/8640 hari
    saveUser();
    loadDashboard();
  }, 10000);
  alert("Mining dimulai!");
}

function watchAd() {
  if (user.adsUsed >= 20) return alert("Batas iklan harian tercapai");
  if (user.rate >= 40 && user.vip === 0) return alert("Upgrade VIP untuk menaikkan lagi");
  user.rate += 1;
  user.adsUsed += 1;
  saveUser();
  loadDashboard();
}

function upgradeVip() {
  if (user.vip >= 1) return alert("Sudah VIP1");
  if (user.balance < 50) return alert("Butuh 50 GST untuk upgrade");
  user.balance -= 50;
  user.vip = 1;
  user.rate = 100;
  saveUser();
  loadDashboard();
}

function deposit() {
  user.balance += 100;
  updateHistory("Deposit 100 GST");
  saveUser();
  loadDashboard();
}

function withdraw() {
  if (user.balance < 10) return alert("Minimal 10 GST untuk tarik");
  user.balance -= 10;
  updateHistory("Withdraw 10 GST");
  saveUser();
  loadDashboard();
}

function updateHistory(text="") {
  if (!user.history) user.history = [];
  if (text) user.history.push(text);
  const div = document.getElementById("history");
  div.innerHTML = "<h3>Riwayat:</h3>" + user.history.map(h => "<p>"+h+"</p>").join("");
}

function copyReferral() {
  navigator.clipboard.writeText(user.referralCode);
  alert("Kode referral disalin!");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// Auto load
if (user) {
  loadDashboard();
  showPage("dashboardPage");
}