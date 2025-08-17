import { guardAndInit, $, getUserData, currentDailyRateGST, accrueEarnings } from './common.js';

guardAndInit(async (user)=>{ sessionStorage.setItem('lastUser', JSON.stringify({uid:user.uid,email:user.email})); await render(user.uid,user.email); });

async function render(uid,email){
  const { data } = await getUserData(uid);
  if(!data) return;
  $('#pEmail').textContent = email;
  $('#pUid').textContent = uid;
  $('#pGst').textContent = (data.gstBalance||0).toFixed(8);
  $('#pUsd').textContent = (data.usdBalance||0).toFixed(2);
  $('#pRate').textContent = currentDailyRateGST(data);
  $('#pVip').textContent = (data.vipLevel===1 && data.vip1ExpiresAt && Date.now()<data.vip1ExpiresAt) ? 'VIP 1' : 'VIP 0';
  $('#pVipEnd').textContent = data.vip1ExpiresAt ? new Date(data.vip1ExpiresAt).toLocaleString() : '-';
}

$('#btnClaim').addEventListener('click', async ()=>{
  try{ const user = JSON.parse(sessionStorage.getItem('lastUser')); await accrueEarnings(user.uid); await render(user.uid,user.email); $('#pMsg').textContent = 'Claim sukses.'; }catch(e){ $('#pMsg').textContent = e.message; }
});