// PERBAIKAN 1: Hapus import firebase-storage dari daftar import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUR5BEuByHZWZPCT2lUn5_G4eclJh2RD4",
  authDomain: "qadc-porto.firebaseapp.com",
  databaseURL: "https://qadc-porto-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "qadc-porto",
  storageBucket: "qadc-porto.firebasestorage.app", // Tetap biarkan di config
  messagingSenderId: "159294492673",
  appId: "1:159294492673:web:96f55c418e57c2909cb000"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// PERBAIKAN 2: Hapus inisialisasi 'const storage = getStorage(app);'

const adminPanel = document.getElementById('admin-panel');
const loginSection = document.getElementById('login-section');
const btnShowLogin = document.getElementById('btn-show-login');
const btnLogout = document.getElementById('btn-logout');

onAuthStateChanged(auth, (user) => {
    if (user) {
        adminPanel.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
        btnShowLogin.classList.add('hidden');
        loginSection.classList.add('hidden');
    } else {
        adminPanel.classList.add('hidden');
        btnLogout.classList.add('hidden');
        btnShowLogin.classList.remove('hidden');
    }
});

document.getElementById('btn-login-submit').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            alert("Login Berhasil!");
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        })
        .catch((error) => alert("Error: " + error.message));
});

btnLogout.addEventListener('click', () => signOut(auth));
btnShowLogin.addEventListener('click', () => loginSection.classList.toggle('hidden'));

document.getElementById('edu-masih-belajar').addEventListener('change', function() {
    document.getElementById('edu-lulus').disabled = this.checked;
});

document.getElementById('btn-tambah-link').addEventListener('click', () => {
    const container = document.getElementById('link-dinamis-container');
    const div = document.createElement('div');
    div.innerHTML = `
        <input type="text" class="link-nama" placeholder="Nama Link (Misal: LinkedIn)">
        <input type="url" class="link-url" placeholder="URL">
        <button onclick="this.parentElement.remove()">Hapus</button>
    `;
    container.appendChild(div);
});

// PERBAIKAN 3: Fungsi uploadFile() dihapus seluruhnya karena kita tidak pakai Firebase Storage lagi

// ==========================================
// CONTOH CRUD 1: SKILL (Tetap Sama)
// ==========================================
document.getElementById('btn-tambah-skill').addEventListener('click', async () => {
    const judul = document.getElementById('skill-judul').value;
    const desc = document.getElementById('skill-desc').value;

    if (!judul) return alert("Nama skill harus diisi!");

    try {
        await addDoc(collection(db, "skills"), {
            judul: judul,
            deskripsi: desc,
            timestamp: Date.now()
        });
        alert("Skill berhasil ditambahkan!");
        document.getElementById('skill-judul').value = '';
        document.getElementById('skill-desc').value = '';
        loadSkills(); 
    } catch (e) {
        console.error("Error menambah data: ", e);
        alert("Gagal menambah data.");
    }
});

async function loadSkills() {
    const list = document.getElementById('tampil-skill');
    list.innerHTML = "Memuat data...";
    try {
        const querySnapshot = await getDocs(collection(db, "skills"));
        list.innerHTML = ""; 
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const li = document.createElement('li');
            li.innerHTML = `<strong>${data.judul}</strong>: ${data.deskripsi} `;
            const btnHapus = document.createElement('button');
            btnHapus.innerText = "Hapus";
            btnHapus.onclick = async () => {
                if(confirm(`Yakin hapus skill ${data.judul}?`)) {
                    await deleteDoc(doc(db, "skills", docSnap.id));
                    loadSkills();
                }
            };
            li.appendChild(btnHapus);
            list.appendChild(li);
        });
    } catch (e) {
        list.innerHTML = "Gagal memuat data.";
    }
}

// ==========================================
// CONTOH CRUD 2: PENGALAMAN & FILE (Menyimpan Teks/URL)
// ==========================================
document.getElementById('btn-tambah-exp').addEventListener('click', async () => {
    const judul = document.getElementById('exp-judul').value;
    const tipeDesc = document.getElementById('exp-tipe-desc').value;
    const desc = document.getElementById('exp-desc').value;
    const link = document.getElementById('exp-link').value;
    
    // PERBAIKAN 4: Ambil string teks/URL dari input, bukan membaca file fisik
    const fileUrl = document.getElementById('exp-file').value; 

    if (!judul) return alert("Nama pengalaman harus diisi!");

    try {
        await addDoc(collection(db, "pengalaman"), {
            judul: judul,
            tipe: tipeDesc,
            deskripsi: desc,
            link: link,
            bukti_file_url: fileUrl, // Menyimpan teks URL/Path ke Firestore
            timestamp: Date.now()
        });
        alert("Data pengalaman berhasil ditambahkan!");
        
        // Reset Form
        document.getElementById('exp-judul').value = '';
        document.getElementById('exp-desc').value = '';
        document.getElementById('exp-link').value = '';
        document.getElementById('exp-file').value = '';
    } catch (e) {
        console.error("Error menambah data: ", e);
        alert("Gagal menambah data pengalaman.");
    }
});

window.onload = () => {
    loadSkills();
};