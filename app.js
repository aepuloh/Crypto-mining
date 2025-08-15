import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCc4ix1uGCaE-rsyM6Lg3jo6SzVjbXYCmw",
  authDomain: "crypto-mining-d3811.firebaseapp.com",
  projectId: "crypto-mining-d3811",
  storageBucket: "crypto-mining-d3811.firebasestorage.app",
  messagingSenderId: "1068882455445",
  appId: "1:1068882455445:web:362538bf3bb36c598f649c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailEl = document.getElementById('email');
const passEl = document.getElementById('password');
const msgEl = document.getElementById('message');
const btnLogin = document.getElementById('btnLogin');
const btnReg = document.getElementById('btnRegister');
const themeBtn = document.getElementById('themeBtn');

let dark = true;
themeBtn.addEventListener('click', () => {
  dark = !dark;
  document.getElementById('body').className = dark ? 'bg-gray-900 text-white min-h-screen flex items-center justify-center' : 'bg-white text-black min-h-screen flex items-center justify-center';
});

function show(msg, color='red'){
  msgEl.textContent = msg;
  msgEl.className = color==='red' ? 'mt-4 text-center text-sm text-red-400' : 'mt-4 text-center text-sm text-green-400';
}

btnReg.addEventListener('click', async () => {
  const email = emailEl.value.trim();
  const pass = passEl.value;
  if(!email || pass.length < 6) return show('Masukkan email valid dan password minimal 6 karakter.');
  try{
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(userCred.user);
    show('Pendaftaran berhasil — cek email untuk verifikasi.', 'green');
    await signOut(auth);
  }catch(e){ show(e.message); }
});

btnLogin.addEventListener('click', async () => {
  const email = emailEl.value.trim();
  const pass = passEl.value;
  if(!email || !pass) return show('Isi email & password.');
  try{
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    if(userCred.user.emailVerified){
      window.location.href = 'dashboard.html';
    } else {
      show('Email belum diverifikasi. Cek inbox.');
      await signOut(auth);
    }
  }catch(e){ show(e.message); }
});

onAuthStateChanged(auth, (u) => {
  if(u && u.emailVerified){ window.location.href = 'dashboard.html'; }
});