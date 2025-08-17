import { guardAndInit, $, getUserData } from './common.js';
import { auth } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { db, ADMIN_UIDS } from './firebase-config.js';

guardAndInit(async (user)=>{
  if (!ADMIN_UIDS.includes(user.uid)){
    $('#adminMsg').textContent = 'Akses ditolak.'; return;
  }
  const q = query(collection(db,'users'), orderBy('updatedAt','desc'));
  const snap = await getDocs(q);
  const tbody = $('#usersTbody'); tbody.innerHTML='';
  snap.forEach(s=>{
    const d = s.data();
    const tr = document.createElement('tr');
    const vipActive = d.vipLevel===1 && d.vip1ExpiresAt && Date.now()<d.vip1ExpiresAt;
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${d.email||'-'}</td>
      <td>${vipActive?'VIP 1':'VIP 0'}</td>
      <td>${(d.gstBalance||0).toFixed(6)}</td>
      <td>$${(d.usdBalance||0).toFixed(2)}</td>
      <td>${vipActive?100:(20+Math.min(d.adsToday||0,20))}</td>
      <td>${d.adsToday||0}</td>
      <td>${d.vip1ExpiresAt? new Date(d.vip1ExpiresAt).toLocaleString():'-'}</td>`;
    tbody.appendChild(tr);
  });
});