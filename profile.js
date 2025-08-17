import { guardAndInit, $, getUserData, currentDailyRateGST } from './common.js';

guardAndInit(async (user)=>{
  sessionStorage.setItem('lastUser', JSON.stringify({uid:user.uid,email:user.email}));
  await render(user.uid, user.email);
});

async function render(uid, email){
  const { data } = await getUserData(uid);
  $('#pEmail').textContent = email;
  $('#pUid').textContent = uid;

  const now = Date.now();
  const vipActive = data.vipLevel===1 && data.vip1ExpiresAt && now < data.vip1ExpiresAt;
  $('#pVip').textContent = vipActive ? 'VIP 1' : 'VIP 0';
  $('#pVip1End').textContent = vipActive ? new Date(data.vip1ExpiresAt).toLocaleString() : '-';

  $('#pGst').textContent = (data.gstBalance||0).toFixed(8);
  $('#pUsd').textContent = (data.usdBalance||0).toFixed(2);
  $('#pRate').textContent = currentDailyRateGST(data);
}

// Claim hanya memaksa accrual langsung (tanpa menunggu interval)
import { accrueEarnings } from './common.js';
$('#btnClaim').addEventListener('click', async ()=>{
  const user = JSON.parse(sessionStorage.getItem('lastUser'));
  await accrueEarnings(user.uid);
  await render(user.uid, user.email);
  $('#pMsg').textContent = 'Earnings berhasil di-claim.';
});