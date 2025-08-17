import { auth, db, ADMIN_UIDS } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

const $ = (id)=>document.getElementById(id);

onAuthStateChanged(auth, async (user)=>{
  if (!user) return location.href = "index.html";
  if (!ADMIN_UIDS.includes(user.uid)){
    $("adminMsg").textContent = "Akses ditolak. UID Anda bukan admin.";
    return;
  }
  await loadUsers();
});

async function loadUsers(){
  const q = query(collection(db, "users"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  const tbody = $("usersTbody");
  tbody.innerHTML = "";
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${docSnap.id}</td>
      <td>${d.email || "-"}</td>
      <td>${d.vipLevel || "Free"}</td>
      <td>${d.hashrate ?? 0}</td>
      <td>${(d.balanceBTC ?? 0).toFixed(8)}</td>
      <td>${d.adsToday ?? 0}</td>
      <td>${d.updatedAt?.toDate ? d.updatedAt.toDate().toLocaleString() : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

$("btnLogoutAdmin")?.addEventListener("click", async ()=>{
  await signOut(auth);
  location.href = "index.html";
});