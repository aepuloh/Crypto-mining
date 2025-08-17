import { initFirebase, auth, db } from './app.js';
import { ADMIN_UIDS } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

initFirebase();

// UI el
const authSection = document.getElementById('authSection');
const adminContent = document.getElementById('adminContent');
const loginBtn = document.getElementById('loginAdminBtn');
const logoutBtn = document.getElementById('logoutAdminBtn');
const emailEl = document.getElementById('adminEmail');
const passEl = document.getElementById('adminPass');
const usersTable = document.getElementById('usersTable');
const searchBox = document.getElementById('searchBox');
const refreshBtn = document.getElementById('refreshBtn');

let cacheUsers = [];

loginBtn.onclick = async ()=>{
  try{
    await signInWithEmailAndPassword(auth, emailEl.value, passEl.value);
  }catch(e){
    alert('❌ ' + (e?.message||e));
  }
};

logoutBtn.onclick = ()=> signOut(auth);

onAuthStateChanged(auth, (user)=>{
  if (!user){
    authSection.style.display = '';
    adminContent.style.display = 'none';
    return;
  }
  if (!ADMIN_UIDS.includes(user.uid)){
    alert('⚠️ Bukan admin');
    signOut(auth);
    return;
  }
  authSection.style.display = 'none';
  adminContent.style.display = '';
  loadUsers();
});

refreshBtn.onclick = loadUsers;

async function loadUsers(){
  usersTable.innerHTML = `<tr><td colspan="9">Loading...</td></tr>`;
  const qs = await getDocs(collection(db, 'users'));
  cacheUsers = qs.docs.map(d=>({ uid: d.id, ...d.data() }));
  render(cacheUsers);
}

function render(list){
  usersTable.innerHTML = '';
  if (!list.length){
    usersTable.innerHTML = `<tr><td colspan="9">Tidak ada user</td></tr>`;
    return;
  }
  list.forEach(u=>{
    const tr = document.createElement('tr');
    const vipExpire = u.vipContractEnd ? new Date(u.vipContractEnd).toLocaleString() : '-';
    tr.innerHTML = `
      <td>${u.uid}</td>
      <td>${u.email||'-'}</td>
      <td>${(u.balanceBtc||0).toFixed(8)}</td>
      <td>$${(u.usdBalance||0).toFixed(2)}</td>
      <td>${(u.miningRatePerDayBtc||0).toFixed(8)}</td>
      <td>VIP ${u.vipLevel||0}</td>
      <td>${u.adsWatchedToday||0}/20</td>
      <td>${vipExpire}</td>
      <td class="row">
        <button onclick="topupUsd('${u.uid}',1)" class="secondary">$+1</button>
        <button onclick="deductUsd('${u.uid}',1)" class="danger">$-1</button>
        <button onclick="resetAds('${u.uid}')">Reset Ads</button>
        <button onclick="setVipPrompt('${u.uid}')">Set VIP</button>
      </td>
    `;
    usersTable.appendChild(tr);
  });
}

searchBox.addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase();
  const f = cacheUsers.filter(u =>
    (u.email||'').toLowerCase().includes(q) || (u.uid||'').toLowerCase().includes(q)
  );
  render(f);
});

// expose actions
window.topupUsd = async (uid, amt)=>{
  const ref = doc(db, 'users', uid);
  const u = cacheUsers.find(x=>x.uid===uid);
  await updateDoc(ref, { usdBalance: (u.usdBalance||0)+amt });
  alert(`✅ USD +$${amt} untuk ${uid}`);
  loadUsers();
};

window.deductUsd = async (uid, amt)=>{
  const ref = doc(db, 'users', uid);
  const u = cacheUsers.find(x=>x.uid===uid);
  if ((u.usdBalance||0) < amt) return alert('Saldo USD kurang');
  await updateDoc(ref, { usdBalance: (u.usdBalance||0)-amt });
  alert(`✅ USD -$${amt} untuk ${uid}`);
  loadUsers();
};

window.resetAds = async (uid)=>{
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { adsWatchedToday: 0 });
  alert(`✅ Reset ads untuk ${uid}`);
  loadUsers();
};

window.setVipPrompt = async (uid)=>{
  const lv = prompt('Masukkan level VIP (0 atau 2):', '0');
  const level = parseInt(lv,10);
  if (![0,2].includes(level)) return alert('Level tidak valid');

  const ref = doc(db, 'users', uid);
  if (level===0){
    await updateDoc(ref, { vipLevel: 0, vipContractEnd: null });
    alert('✅ VIP di-set ke 0');
  } else {
    const days = prompt('Kontrak VIP2 berapa hari? (default 6)', '6');
    const d = parseInt(days,10) || 6;
    const end = Date.now() + d*24*60*60*1000;
    await updateDoc(ref, { vipLevel: 2, vipContractEnd: end });
    alert('✅ VIP2 aktif');
  }
  loadUsers();
};
