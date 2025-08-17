import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';

const el = id => document.getElementById(id);
const authMsg = el('authMsg');

// tabs
el('tabLogin').addEventListener('click', ()=>{ el('loginPane').classList.add('shown'); el('registerPane').classList.remove('shown'); el('tabLogin').classList.add('active'); el('tabRegister').classList.remove('active'); });
el('tabRegister').addEventListener('click', ()=>{ el('registerPane').classList.add('shown'); el('loginPane').classList.remove('shown'); el('tabRegister').classList.add('active'); el('tabLogin').classList.remove('active'); });

el('btnLogin').addEventListener('click', async ()=>{
  const email = el('loginEmail').value.trim(); const pass = el('loginPassword').value;
  if(!email||!pass) return authMsg.textContent='Isi email & password';
  try{ await signInWithEmailAndPassword(auth,email,pass); location.href='dashboard.html'; }catch(e){ authMsg.textContent = e.message; }
});

el('btnRegister').addEventListener('click', async ()=>{
  const email = el('regEmail').value.trim(); const pass = el('regPassword').value;
  if(!email || pass.length<6) return authMsg.textContent='Password minimal 6 karakter';
  try{
    const cred = await createUserWithEmailAndPassword(auth,email,pass);
    const ref = doc(db,'users',cred.user.uid);
    await setDoc(ref, { email, vipLevel:0, vip1ExpiresAt:null, gstBalance:0, usdBalance:0, adsToday:0, adsDay:new Date().toISOString().slice(0,10), lastAccrualAt:Date.now(), updatedAt:serverTimestamp() });
    location.href='dashboard.html';
  }catch(e){ authMsg.textContent = e.message; }
});

onAuthStateChanged(auth, (u)=>{ if(u) location.href='dashboard.html'; });