import { GST_RATE_USD } from './firebase-config.js';
const $ = id=>document.getElementById(id);
$('gstInput').addEventListener('input', ()=>{ const gst = parseFloat($('gstInput').value || '0'); $('usdOut').textContent = (gst * GST_RATE_USD).toFixed(6); });