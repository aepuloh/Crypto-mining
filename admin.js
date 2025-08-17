import { guardAndInit, $, fetchPendingDeposits, adminConfirmDeposit } from './common.js';
import { ADMIN_UIDS } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';
import { db } from './firebase-config.js';

guardAndInit(async (user)=>{
  if(!ADMIN_UIDS.includes(user.uid)){ $('#adminMsg').textContent='Akses admin ditolak'; return; }
  await renderPending();
});

async function renderPending(){
  const q = query(collection(db,'deposits'), orderBy('requestedAt','desc'));
  const snap = await getDocs(q); const tbody = $('#depTbody'); tbody.innerHTML='';
  snap.forEach(d=>{
    const data = d.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.id}</td><td>${data.uid}</td><td>$${data.amountUsd}</td><td>${data.proof||'-'}</td><td><button class='btn' data-id='${d.id}' data-uid='${data.uid}' data-amt='${data.amountUsd}'>Confirm</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button').forEach(b=> b.addEventListener('click', async (e)=>{
    const id = b.getAttribute('data-id'); const uid = b.getAttribute('data-uid'); const amt = parseFloat(b.getAttribute('data-amt'));
    try{ await adminConfirmDeposit(id,uid,amt); b.textContent='Done'; b.disabled=true; }catch(err){ alert(err.message); }
  }));
}