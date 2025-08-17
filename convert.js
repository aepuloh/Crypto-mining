import { GST_RATE_USD } from './common.js';
const $ = (id)=>document.getElementById(id);

$('#gstInput').addEventListener('input', ()=>{
  const gst = parseFloat($('#gstInput').value || '0');
  const usd = gst * GST_RATE_USD;
  $('#usdOut').textContent = usd.toFixed(6);
});

import { guardAndInit } from './common.js';
guardAndInit(()=>{});