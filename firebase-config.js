// Ganti dengan config proyekmu
export const firebaseConfig = {
  apiKey: "AIzaSyCc4ix1uGCaE-rsyM6Lg3jo6SzVjbXYCmw",
  authDomain: "crypto-mining-d3811.firebaseapp.com",
  projectId: "crypto-mining-d3811",
  storageBucket: "crypto-mining-d3811.firebasestorage.app",
  messagingSenderId: "1068882455445",
  appId: "1:1068882455445:web:362538bf3bb36c598f649c"
};

// Isi manual UID admin (contoh: "ABC123...")
export const ADMIN_UIDS = [
  // "UtDD46hVtkNckFSep1TNqqE1oaa2"
];

// QRIS image (admin) - bisa diisi URL gambar QRIS
export const QRIS_IMAGE = ""; // contoh: '/assets/qris.png'

// Konstanta
export const GST_RATE_USD = 0.0003;
export const MAX_ADS_PER_DAY = 20;

// Firebase init
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);