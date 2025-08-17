import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

const el = (id)=>document.getElementById(id);
const authMsg = el('authMsg');

// Tabs
const tabLogin = el('tabLogin'); const tabRegister = el('tabRegister');
const loginPane = el('loginPane'); const registerPane = el('registerPane');
const showTab = (t)=>{ if(t==='login'){loginPane.classList.add('shown');registerPane.classList.remove('shown');tabLogin.classList.add('active');tabRegister.classList.remove('active');}else{registerPane.classList.add('shown');loginPane.classList.remove('shown');tabRegister.classList.add('active');tabLogin.classList.remove('active');} };

tabLogin.addEventListener('click', ()=>showTab('login'));
tabRegister.addEventListener('click', ()=>showTab('register'));

el('btnLogin').addEventListener('click', async ()=>{
  const email = el('loginEmail').value.trim();
  const pass = el('loginPassword').value;
  if(!email||!pass) return toast('Isi email & password');
  try{ await signInWithEmailAndPassword(auth, email, pass); location.href='dashboard.html'; }
  catch(e){ toast(parseError(e)); }
});

el('btnRegister').addEventListener('click', async ()=>{
  const email = el('regEmail').value.trim();
  const pass = el('regPassword').value;
  if(pass.length<6) return toast('Password minimal 6 karakter');
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const ref = doc(db,'users',cred.user.uid);
    await setDoc(ref, {
      email, vipLevel:0, vip1ExpiresAt:null, gstBalance:0, usdBalance:0,
      adsToday:0, adsDay:new Date().toISOString().slice(0,10), lastAccrualAt: Date.now(), updatedAt: serverTimestamp()
    });
    location.href='dashboard.html';
  }catch(e){ toast(parseError(e)); }
});

onAuthStateChanged(auth, (u)=>{ if(u) location.href='dashboard.html'; });

function toast(m){ authMsg.textContent = m; }
function parseError(e){ const m=e?.message||String(e); if(m.includes('auth/invalid-credential')) return 'Email atau password salah'; if(m.includes('auth/email-already-in-use')) return 'Email sudah terdaftar'; return m; }