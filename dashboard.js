import { guardAndInit, $, getUserData, watchAd, buyVIP1, submitDepositRequest, GST_RATE_USD } from './common.js';

let miningTimer = null;

guardAndInit(async (user)=>{
  // set QRIS image if provided
  import('./firebase-config.js').then(m=>{ if(m.QRIS_IMAGE) $('#qrisImg').src = m.QRIS_IMAGE; });
  await render(user.uid);
});

async function render(uid){
  const { data } = await getUserData(uid);
  if(!data) return;
  $('#balGst').textContent = (data.gstBalance||0).toFixed(8);
  $('#balUsd').textContent = (data.usdBalance||0).toFixed(2);
  $('#lastClaim').textContent = data.lastAccrualAt ? new Date(data.lastAccrualAt).toLocaleString() : '-';
  $('#rateDaily').textContent = ((data.vipLevel===1 && data.vip1ExpiresAt && Date.now()<data.vip1ExpiresAt) ? 100 : 20 + ((data.adsDay===new Date().toISOString().slice(0,10))?Math.min(data.adsToday||0,20):0));
  $('#vipLevel').textContent = (data.vipLevel===1 && data.vip1ExpiresAt && Date.now()<data.vip1ExpiresAt) ? 'VIP 1' : 'VIP 0';
}

// Mining UI simulation (local only) — visual only, accrual runs serverless via timestamps
$('#btnStart').addEventListener('click', ()=>{
  if(miningTimer) return; $('#mineStatus').textContent='Running'; let p=0; miningTimer = setInterval(()=>{ p=(p+3)%100; $('#mineBar').style.width = p+'%'; },150); $('#mineMsg').textContent='Mining (visual) — earnings accrue when you return or claim.';
});
$('#btnStop').addEventListener('click', ()=>{ if(miningTimer){ clearInterval(miningTimer); miningTimer=null; } $('#mineBar').style.width='0%'; $('#mineStatus').textContent='Idle'; $('#mineMsg').textContent='Mining stopped.'; });

// Watch ad
$('#btnWatchAd').addEventListener('click', async ()=>{
  try{ $('#vipMsg').textContent='Menonton iklan...'; await new Promise(r=>setTimeout(r,2500)); const user = JSON.parse(sessionStorage.getItem('lastUser')); await watchAd(user.uid); $('#vipMsg').textContent='Iklan selesai — rate harian bertambah.'; await render(user.uid); }catch(e){ $('#vipMsg').textContent = e.message; }
});

// Buy VIP1
$('#btnBuyVIP1').addEventListener('click', async ()=>{
  try{ const user = JSON.parse(sessionStorage.getItem('lastUser')); await buyVIP1(user.uid); $('#vipMsg').textContent = 'Berhasil upgrade ke VIP1 (7 hari).'; await render(user.uid); }catch(e){ $('#vipMsg').textContent = e.message; }
});

// Deposit request
$('#btnSubmitDep').addEventListener('click', async ()=>{
  try{
    const amt = parseFloat($('#depAmount').value || '0'); const proof = $('#depProof').value.trim();
    if(amt <= 0) return $('#depMsg').textContent='Masukkan nominal valid';
    const user = JSON.parse(sessionStorage.getItem('lastUser'));
    await submitDepositRequest(user.uid, amt, proof || 'bukti');
    $('#depMsg').textContent = 'Request deposit terkirim — tunggu konfirmasi admin.';
  }catch(e){ $('#depMsg').textContent = e.message; }
});