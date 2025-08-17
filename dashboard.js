import { guardAndInit, $, watchAd, buyVIP1, getUserData, currentDailyRateGST } from './common.js';

let miningTimer=null;

guardAndInit(async (user)=>{
  const { data } = await getUserData(user.uid);
  updateVipUI(data);
});

function updateVipUI(d){
  const now = Date.now();
  const vipActive = d.vipLevel===1 && d.vip1ExpiresAt && now<d.vip1ExpiresAt;
  $('#vipLevel').textContent = vipActive ? 'VIP 1' : 'VIP 0';
}

// Mining UI (simulasi)
$('#btnStart').addEventListener('click', ()=>{
  if(miningTimer) return; $('#mineStatus').textContent='Mining berjalan';
  let p=0; miningTimer=setInterval(()=>{ p=(p+2)%100; $('#mineBar').style.width=p+'%'; },200);
});
$('#btnStop').addEventListener('click', ()=>{ if(miningTimer){clearInterval(miningTimer); miningTimer=null;} $('#mineBar').style.width='0%'; $('#mineStatus').textContent='Idle'; });

// Nonton iklan (VIP0 bonus +1 GST/hari)
$('#btnWatchAd').addEventListener('click', async ()=>{
  try{
    $('#vipMsg').textContent='Menonton iklan...';
    await new Promise(r=>setTimeout(r,2500)); // simulasi
    const user = JSON.parse(sessionStorage.getItem('lastUser')); // di-set di guardAndInit
    await watchAd(user.uid);
    $('#vipMsg').textContent='Iklan selesai. Rate harian +1 GST (maks 20/hari).';
  }catch(e){ $('#vipMsg').textContent=e.message; }
});

// Upgrade VIP1 ($5, 7 hari)
$('#btnBuyVIP1').addEventListener('click', async ()=>{
  try{
    const user = JSON.parse(sessionStorage.getItem('lastUser'));
    await buyVIP1(user.uid);
    const { data } = await getUserData(user.uid);
    updateVipUI(data);
    $('#vipMsg').textContent='Berhasil upgrade ke VIP 1 (7 hari).';
  }catch(e){ $('#vipMsg').textContent=e.message; }
});