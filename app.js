// Ganti dengan konfigurasi dari Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCc4ix1uGCaE-rsyM6Lg3jo6SzVjbXYCmw",
  authDomain: "crypto-mining-d3811.firebaseapp.com",
  projectId: "crypto-mining-d3811",
  storageBucket: "crypto-mining-d3811.firebasestorage.app",
  messagingSenderId: "1068882455445",
  appId: "1:1068882455445:web:362538bf3bb36c598f649c"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const messageEl = document.getElementById("message");

// Register user baru
function register() {
  const email = emailEl.value;
  const password = passwordEl.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      user.sendEmailVerification()
        .then(() => {
          messageEl.textContent = "Pendaftaran berhasil. Cek email untuk verifikasi!";
        });
    })
    .catch(error => {
      messageEl.textContent = error.message;
    });
}

// Login user
function login() {
  const email = emailEl.value;
  const password = passwordEl.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      if (user.emailVerified) {
        messageEl.textContent = "Login berhasil!";
        // redirect ke halaman utama
        window.location.href = "dashboard.html";
      } else {
        messageEl.textContent = "Email belum diverifikasi. Cek inbox Anda.";
        auth.signOut();
      }
    })
    .catch(error => {
      messageEl.textContent = error.message;
    });
}