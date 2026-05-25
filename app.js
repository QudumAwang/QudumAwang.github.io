console.log("Memulai Web Portofolio Mode Lokal (Tanpa Firebase)...");

// ==========================================
// 1. SETUP DATABASE LOKAL (PENGGANTI FIREBASE)
// ==========================================
// Ini adalah struktur dasar database kamu jika masih kosong
const defaultData = {
    profil: {},
    pendidikan: [],
    skills: [],
    pengalaman: []
};

// Variabel utama yang memegang semua data di memori
let dbData = JSON.parse(JSON.stringify(defaultData)); 
let editStateId = { edu: null, skill: null, exp: null };

// KATA SANDI ADMIN LOKAL (Ubah sesuai keinginanmu)
const ADMIN_PASSWORD = "admin";

// ==========================================
// 2. FUNGSI INISIALISASI DATA (BACA JSON/LOCAL)
// ==========================================
async function initData() {
    // 1. Cek apakah ada data yang sedang diedit di LocalStorage browser
    const localData = localStorage.getItem('portofolioData');
    
    if (localData) {
        dbData = JSON.parse(localData);
        console.log("Data dimuat dari LocalStorage browser.");
    } else {
        // 2. Jika LocalStorage kosong, coba ambil file data.json dari server GitHub
        try {
            // Kita tambahkan cache-busting (?v=waktu) agar tidak mengambil file lama
            const response = await fetch('data.json?v=' + new Date().getTime());
            if (response.ok) {
                dbData = await response.json();
                console.log("Data dimuat dari file data.json GitHub.");
                // Simpan ke local storage untuk proses edit selanjutnya
                saveToLocalStorage(); 
            } else {
                console.warn("File data.json tidak ditemukan. Menggunakan data kosong.");
            }
        } catch (error) {
            console.error("Gagal mengambil data.json (Mungkin dijalankan tanpa Live Server).", error);
        }
    }
    
    // Render semua tampilan
    renderSemua();
}

function saveToLocalStorage() {
    localStorage.setItem('portofolioData', JSON.stringify(dbData));
}

// Fitur Export: Download database menjadi file data.json untuk di-push ke GitHub
document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = JSON.stringify(dbData, null, 4); // Format rapi
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = "data.json"; // Nama file yang akan didownload
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("File data.json berhasil diunduh!\n\nLangkah selanjutnya:\nTimpa file data.json yang lama di folder laptopmu dengan file ini, lalu Push ke GitHub agar perubahan ini bisa dilihat oleh semua orang.");
});

document.getElementById('btn-reset-local').addEventListener('click', () => {
    if(confirm("Yakin ingin menghapus draf lokalmu dan memuat ulang data asli dari GitHub?")) {
        localStorage.removeItem('portofolioData');
        location.reload();
    }
});


// ==========================================
// 3. LOGIKA UI & LOGIN LOKAL
// ==========================================
function formatTanggalIndo(dateString) {
    if (!dateString || dateString === "Sekarang") return dateString;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const d = new Date(dateString);
    if(isNaN(d)) return dateString;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const publicLayout = document.getElementById('public-layout');
const adminLayout = document.getElementById('admin-layout');
const btnToggleAdmin = document.getElementById('btn-toggle-admin');
const btnCloseAdmin = document.getElementById('btn-close-admin');
const btnLogout = document.getElementById('btn-logout');
const loginOverlay = document.getElementById('login-overlay');
const btnShowLoginModal = document.getElementById('btn-show-login-modal');
const btnCloseLoginModal = document.getElementById('btn-login-close');
const topbarFoto = document.getElementById('topbar-foto');
const profileDropdown = document.getElementById('profile-dropdown');
const expModal = document.getElementById('exp-modal-overlay');
const expModalClose = document.getElementById('close-exp-modal');
expModalClose.addEventListener('click', () => expModal.classList.add('hidden'));

// Cek status login saat halaman dimuat
if (sessionStorage.getItem('isAdminLoggedIn')) {
    setAdminMode(true);
} else {
    setAdminMode(false);
}

function setAdminMode(isLoggedIn) {
    if (isLoggedIn) {
        btnToggleAdmin.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
        document.body.classList.add('is-admin');
        profileDropdown.classList.add('hidden');
    } else {
        btnToggleAdmin.classList.add('hidden');
        btnLogout.classList.add('hidden');
        adminLayout.classList.add('hidden');
        publicLayout.classList.remove('hidden');
        document.body.classList.remove('is-admin');
    }
}

topbarFoto.addEventListener('click', () => { if(!document.body.classList.contains('is-admin')) profileDropdown.classList.toggle('hidden'); });
btnShowLoginModal.addEventListener('click', () => { profileDropdown.classList.add('hidden'); loginOverlay.classList.remove('hidden'); });
btnCloseLoginModal.addEventListener('click', () => loginOverlay.classList.add('hidden'));

document.getElementById('toggle-password').addEventListener('click', function() {
    const passInput = document.getElementById('login-password');
    if(passInput.type === 'password') { passInput.type = 'text'; this.innerText = '🙈'; } 
    else { passInput.type = 'password'; this.innerText = '👁️'; }
});

// Sistem Login Lokal (Cek Password)
document.getElementById('btn-login-submit').addEventListener('click', () => {
    const pass = document.getElementById('login-password').value;
    
    if (pass === ADMIN_PASSWORD) {
        alert("Berhasil masuk ke Dashboard Admin!");
        sessionStorage.setItem('isAdminLoggedIn', 'true'); // Simpan sesi sementara di tab
        document.getElementById('login-password').value = '';
        loginOverlay.classList.add('hidden'); 
        publicLayout.classList.add('hidden');
        adminLayout.classList.remove('hidden'); 
        setAdminMode(true);
        window.scrollTo(0,0);
    } else {
        alert("Password Salah!");
    }
});

btnLogout.addEventListener('click', () => { 
    sessionStorage.removeItem('isAdminLoggedIn');
    setAdminMode(false);
    alert("Berhasil Logout."); 
});

btnToggleAdmin.addEventListener('click', () => { publicLayout.classList.add('hidden'); adminLayout.classList.remove('hidden'); window.scrollTo(0,0);});
btnCloseAdmin.addEventListener('click', () => { adminLayout.classList.add('hidden'); publicLayout.classList.remove('hidden'); window.scrollTo(0,0);});

function resetForm(type) {
    if (type === 'edu') {
        editStateId.edu = null;
        document.getElementById('edu-instansi').value = ''; document.getElementById('edu-gelar').value = '';
        document.getElementById('edu-lokasi').value = ''; document.getElementById('edu-jurusan').value = '';
        document.getElementById('edu-ipk').value = ''; document.getElementById('edu-mulai').value = '';
        document.getElementById('edu-lulus').value = ''; document.getElementById('edu-masih-belajar').checked = false;
        document.getElementById('edu-lulus').disabled = false; document.getElementById('edu-file').value = '';
        document.getElementById('btn-tambah-edu').innerText = '+ Tambah / Simpan Data';
        document.getElementById('btn-batal-edit-edu').classList.add('hidden');
    } else if (type === 'skill') {
        editStateId.skill = null;
        document.getElementById('skill-judul').value = ''; document.getElementById('skill-desc').value = '';
        document.getElementById('btn-tambah-skill').innerText = '+ Tambah / Simpan Skill';
        document.getElementById('btn-batal-edit-skill').classList.add('hidden');
    } else if (type === 'exp') {
        editStateId.exp = null;
        document.getElementById('exp-judul').value = ''; document.getElementById('exp-desc').value = '';
        document.getElementById('exp-link').value = ''; document.getElementById('exp-file').value = '';
        document.getElementById('exp-tipe-desc').value = 'paragraf'; document.getElementById('exp-poin-container').innerHTML = '';
        document.getElementById('exp-desc').classList.remove('hidden'); document.getElementById('exp-poin-wrapper').classList.add('hidden');
        document.getElementById('btn-tambah-exp').innerText = '+ Tambah / Simpan Pengalaman';
        document.getElementById('btn-batal-edit-exp').classList.add('hidden');
    }
}
document.getElementById('btn-batal-edit-edu').onclick = () => resetForm('edu');
document.getElementById('btn-batal-edit-skill').onclick = () => resetForm('skill');
document.getElementById('btn-batal-edit-exp').onclick = () => resetForm('exp');

// Fitur Drag & Drop untuk Array Lokal
function enableDragAndDropLocal(containerId, arrayData, renderCallback) {
    const container = document.getElementById(containerId);
    let draggedItemIndex = null;

    container.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('admin-list-item')) {
            draggedItemIndex = parseInt(e.target.getAttribute('data-index'));
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggedElement = document.querySelector('.dragging');
        if (draggedElement) {
            if (afterElement == null) { container.appendChild(draggedElement); } 
            else { container.insertBefore(draggedElement, afterElement); }
        }
    });

    container.addEventListener('dragend', (e) => {
        const draggedElement = document.querySelector('.dragging');
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            
            // Baca urutan baru dari DOM
            const newArray = [];
            const items = container.querySelectorAll('.admin-list-item');
            items.forEach(item => {
                const oldIndex = parseInt(item.getAttribute('data-index'));
                newArray.push(arrayData[oldIndex]);
            });
            
            // Update array utama
            arrayData.length = 0;
            arrayData.push(...newArray);
            
            saveToLocalStorage();
            renderCallback();
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.admin-list-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else { return closest; }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}


// ==========================================
// 4. LOGIKA CRUD LOCAL DATABASE
// ==========================================

// --- RENDER SEMUA ---
function renderSemua() {
    renderBiodata();
    renderPendidikan();
    renderSkills();
    renderPengalaman();
}

// --- BIODATA ---
document.getElementById('btn-tambah-link').addEventListener('click', () => {
    const container = document.getElementById('link-dinamis-container');
    const div = document.createElement('div');
    div.style.marginBottom = "8px"; div.style.display = "flex"; div.style.gap = "10px";
    div.innerHTML = `
        <input type="text" class="link-nama" placeholder="Teks Link" style="width:35%; margin:0;">
        <input type="url" class="link-url" placeholder="URL Lengkap" style="width:55%; margin:0;">
        <button class="btn-hapus" style="margin:0;" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
});

document.getElementById('btn-simpan-biodata').addEventListener('click', () => {
    dbData.profil.nama = document.getElementById('bio-nama').value || "";
    dbData.profil.email = document.getElementById('bio-email').value || "";
    dbData.profil.wa = document.getElementById('bio-wa').value || "";
    dbData.profil.foto_profil = document.getElementById('bio-foto-profil').value || "";
    dbData.profil.foto_full = document.getElementById('bio-foto-full').value || "";
    dbData.profil.bg1 = document.getElementById('color-bg1').value;
    dbData.profil.bg2 = document.getElementById('color-bg2').value;
    dbData.profil.text_color = document.getElementById('color-text').value;
    dbData.profil.nav_color = document.getElementById('color-nav').value;
    dbData.profil.btn_color = document.getElementById('color-btn').value;

    const linkNamas = document.querySelectorAll('.link-nama');
    const linkUrls = document.querySelectorAll('.link-url');
    let linksArray = [];
    for(let i = 0; i < linkNamas.length; i++) {
        if(linkNamas[i].value.trim() !== "" && linkUrls[i].value.trim() !== "") {
            linksArray.push({ nama: linkNamas[i].value, url: linkUrls[i].value });
        }
    }
    dbData.profil.links = linksArray;

    saveToLocalStorage();
    alert("Biodata berhasil disimpan ke draf!"); renderSemua();
});

document.getElementById('btn-simpan-desc').addEventListener('click', () => {
    dbData.profil.deskripsi = document.getElementById('desc-text').value || "";
    saveToLocalStorage();
    alert("Deskripsi berhasil disimpan ke draf!"); renderSemua();
});

function renderBiodata() {
    const data = dbData.profil;
    let namaLengkap = data.nama || "Nama User";
    
    document.getElementById('topbar-name').innerText = namaLengkap;
    if(data.foto_profil) document.getElementById('topbar-foto').src = data.foto_profil;
    if(data.foto_full) document.getElementById('tampil-foto-full').src = data.foto_full;
    
    let subInfoHTML = [];
    if(data.email) subInfoHTML.push(data.email);
    if(data.wa) subInfoHTML.push(data.wa);
    if(data.links && data.links.length > 0) {
        data.links.forEach(l => { subInfoHTML.push(`<a href="${l.url}" target="_blank" style="color: var(--text-color);">${l.nama}</a>`); });
    }
    document.getElementById('tampil-kontak-link').innerHTML = subInfoHTML.join(' &nbsp;|&nbsp; ');

    document.documentElement.style.setProperty('--bg-color-1', data.bg1 || '#e0f2fe');
    document.documentElement.style.setProperty('--bg-color-2', data.bg2 || '#4fc3f7');
    document.documentElement.style.setProperty('--text-color', data.text_color || '#1e293b');
    document.documentElement.style.setProperty('--nav-color', data.nav_color || '#0f172a');
    document.documentElement.style.setProperty('--btn-color', data.btn_color || '#0ea5e9');

    // Populate Form Admin
    document.getElementById('bio-nama').value = data.nama || ""; document.getElementById('bio-email').value = data.email || "";
    document.getElementById('bio-wa').value = data.wa || ""; document.getElementById('bio-foto-profil').value = data.foto_profil || "";
    document.getElementById('bio-foto-full').value = data.foto_full || "";
    document.getElementById('color-bg1').value = data.bg1 || "#e0f2fe"; document.getElementById('color-bg2').value = data.bg2 || "#4fc3f7";
    document.getElementById('color-text').value = data.text_color || "#1e293b";
    document.getElementById('color-nav').value = data.nav_color || "#0f172a"; document.getElementById('color-btn').value = data.btn_color || "#0ea5e9";
    document.getElementById('desc-text').value = data.deskripsi || "";
    document.getElementById('tampil-deskripsi').innerText = data.deskripsi || "Belum ada deskripsi.";

    const linkContainer = document.getElementById('link-dinamis-container');
    linkContainer.innerHTML = '<h4 style="margin-bottom: 10px; color:#d97706;">Links Eksternal</h4>';
    if(data.links && data.links.length > 0) {
        data.links.forEach(l => {
            const div = document.createElement('div');
            div.style.marginBottom = "8px"; div.style.display = "flex"; div.style.gap = "10px";
            div.innerHTML = `
                <input type="text" class="link-nama" value="${l.nama}" placeholder="Teks" style="width:35%; margin:0;">
                <input type="url" class="link-url" value="${l.url}" placeholder="URL" style="width:55%; margin:0;">
                <button class="btn-hapus" style="margin:0;" onclick="this.parentElement.remove()">X</button>
            `;
            linkContainer.appendChild(div);
        });
    }

    // Tempel gelar ke Nama (diambil dari data pendidikan)
    let arrGelar = dbData.pendidikan.filter(p => p.gelar && p.gelar.trim() !== "").map(p => p.gelar);
    if(arrGelar.length > 0) namaLengkap += ", " + arrGelar.join(", ");
    document.getElementById('tampil-nama-besar').innerText = namaLengkap;
}

// --- PENDIDIKAN ---
document.getElementById('edu-masih-belajar').addEventListener('change', function() {
    document.getElementById('edu-lulus').disabled = this.checked;
});

document.getElementById('btn-tambah-edu').addEventListener('click', () => {
    const instansi = document.getElementById('edu-instansi').value;
    if (!instansi) return alert("Asal Sekolah wajib diisi!");
    
    const payload = {
        instansi: instansi, gelar: document.getElementById('edu-gelar').value || "",
        lokasi: document.getElementById('edu-lokasi').value || "", jurusan: document.getElementById('edu-jurusan').value || "",
        ipk: document.getElementById('edu-ipk').value || "", mulai: document.getElementById('edu-mulai').value || "",
        lulus: document.getElementById('edu-masih-belajar').checked ? "Sekarang" : document.getElementById('edu-lulus').value,
        bukti_file_url: document.getElementById('edu-file').value || ""
    };

    if (editStateId.edu !== null) {
        dbData.pendidikan[editStateId.edu] = payload;
    } else {
        dbData.pendidikan.push(payload);
    }
    
    saveToLocalStorage();
    resetForm('edu'); renderSemua();
});

function renderPendidikan() {
    const pubContainer = document.getElementById('tampil-pendidikan');
    const adminContainer = document.getElementById('admin-list-edu');
    
    pubContainer.innerHTML = ""; adminContainer.innerHTML = "";

    dbData.pendidikan.forEach((data, index) => {
        const tglMulai = formatTanggalIndo(data.mulai);
        const tglLulus = formatTanggalIndo(data.lulus);

        const div = document.createElement('div'); div.className = "edu-card";
        div.innerHTML = `
            <div class="edu-row-1">
                <span class="edu-row-1-kiri">${data.instansi} <small style="font-size:0.75em; font-weight:500; color:#64748b; margin-left:8px;">${data.lokasi ? `| ${data.lokasi}` : ''}</small></span>
                <span class="edu-row-1-kanan">${tglMulai} - ${tglLulus}</span>
            </div>
            <div class="edu-row-2">
                <span class="edu-row-2-kiri">${data.jurusan || ""}</span>
                <div class="edu-row-2-kanan">
                    ${data.ipk ? `<span>IPK: <strong>${data.ipk}</strong></span>` : ''}
                    ${data.bukti_file_url ? `<a href="${data.bukti_file_url}" target="_blank" class="btn-pdf">Transkrip</a>` : ''}
                </div>
            </div>
        `;
        pubContainer.appendChild(div);

        const adm = document.createElement('div');
        adm.className = "admin-list-item"; adm.setAttribute('draggable', true); adm.setAttribute('data-index', index);
        adm.innerHTML = `
            <div class="admin-list-content">
                <div class="drag-handle" title="Tarik untuk memindahkan">☰</div>
                <div><strong style="color:var(--nav-color);">${data.instansi}</strong> <br> <small>${data.jurusan || "-"}</small></div>
            </div>
            <div>
                <button class="btn-edit" style="margin-right:5px;">Edit</button>
                <button class="btn-hapus">Hapus</button>
            </div>
        `;
        adm.querySelector('.btn-edit').onclick = () => {
            resetForm('edu'); 
            document.getElementById('edu-instansi').value = data.instansi; document.getElementById('edu-gelar').value = data.gelar || "";
            document.getElementById('edu-lokasi').value = data.lokasi || ""; document.getElementById('edu-jurusan').value = data.jurusan || "";
            document.getElementById('edu-ipk').value = data.ipk || ""; document.getElementById('edu-mulai').value = data.mulai || "";
            if(data.lulus === "Sekarang") {
                document.getElementById('edu-masih-belajar').checked = true; document.getElementById('edu-lulus').disabled = true;
            } else {
                document.getElementById('edu-masih-belajar').checked = false; document.getElementById('edu-lulus').disabled = false;
                document.getElementById('edu-lulus').value = data.lulus || "";
            }
            document.getElementById('edu-file').value = data.bukti_file_url || "";
            editStateId.edu = index;
            document.getElementById('btn-tambah-edu').innerText = 'Simpan Perubahan Data';
            document.getElementById('btn-batal-edit-edu').classList.remove('hidden');
            window.scrollTo(0, document.getElementById('edu-instansi').offsetTop - 100);
        };
        adm.querySelector('.btn-hapus').onclick = () => { 
            if(confirm(`Yakin ingin menghapus ${data.instansi}?`)) { 
                dbData.pendidikan.splice(index, 1);
                saveToLocalStorage(); renderSemua(); 
            } 
        };
        adminContainer.appendChild(adm);
    });
    
    enableDragAndDropLocal('admin-list-edu', dbData.pendidikan, renderSemua);
}

// --- SKILLS ---
document.getElementById('btn-tambah-skill').addEventListener('click', () => {
    const judul = document.getElementById('skill-judul').value;
    if (!judul) return alert("Nama skill wajib diisi!");
    const payload = { judul: judul, deskripsi: document.getElementById('skill-desc').value || "" };

    if (editStateId.skill !== null) {
        dbData.skills[editStateId.skill] = payload;
    } else {
        dbData.skills.push(payload);
    }
    saveToLocalStorage(); resetForm('skill'); renderSemua(); 
});

function renderSkills() {
    const pubList = document.getElementById('tampil-skill');
    const adminList = document.getElementById('admin-list-skill');
    pubList.innerHTML = ""; adminList.innerHTML = "";
    
    dbData.skills.forEach((data, index) => {
        const li = document.createElement('li'); li.className = "skill-card"; li.innerHTML = `${data.judul}`; pubList.appendChild(li);

        const adm = document.createElement('div');
        adm.className = "admin-list-item"; adm.setAttribute('draggable', true); adm.setAttribute('data-index', index);
        adm.innerHTML = `
            <div class="admin-list-content">
                <div class="drag-handle">☰</div>
                <div><strong style="color:var(--nav-color);">${data.judul}</strong></div>
            </div>
            <div>
                <button class="btn-edit" style="margin-right:5px;">Edit</button>
                <button class="btn-hapus">Hapus</button>
            </div>
        `;
        adm.querySelector('.btn-edit').onclick = () => {
            resetForm('skill');
            document.getElementById('skill-judul').value = data.judul; document.getElementById('skill-desc').value = data.deskripsi || "";
            editStateId.skill = index; document.getElementById('btn-tambah-skill').innerText = 'Simpan Perubahan';
            document.getElementById('btn-batal-edit-skill').classList.remove('hidden'); window.scrollTo(0, document.getElementById('skill-judul').offsetTop - 100);
        };
        adm.querySelector('.btn-hapus').onclick = () => { 
            if(confirm(`Yakin ingin menghapus ${data.judul}?`)) { 
                dbData.skills.splice(index, 1); saveToLocalStorage(); renderSemua(); 
            } 
        };
        adminList.appendChild(adm);
    });
    enableDragAndDropLocal('admin-list-skill', dbData.skills, renderSemua);
}

// --- PENGALAMAN ---
document.getElementById('exp-tipe-desc').addEventListener('change', function() {
    if(this.value === 'poin') {
        document.getElementById('exp-desc').classList.add('hidden'); document.getElementById('exp-poin-wrapper').classList.remove('hidden');
    } else {
        document.getElementById('exp-desc').classList.remove('hidden'); document.getElementById('exp-poin-wrapper').classList.add('hidden');
    }
});

document.getElementById('btn-add-poin-input').addEventListener('click', () => {
    const container = document.getElementById('exp-poin-container'); const wrap = document.createElement('div');
    wrap.style.display = "flex"; wrap.style.marginBottom = "8px"; wrap.style.gap = "10px";
    wrap.innerHTML = `<input type="text" class="input-poin-item" placeholder="Ketik poin..." style="margin:0;"><button class="btn-hapus" style="margin:0;" onclick="this.parentElement.remove()">X</button>`;
    container.appendChild(wrap);
});

document.getElementById('btn-tambah-exp').addEventListener('click', () => {
    const judul = document.getElementById('exp-judul').value;
    if (!judul) return alert("Nama pengalaman wajib diisi!");
    
    const tipe = document.getElementById('exp-tipe-desc').value;
    let descText = ""; let arrPoin = [];
    if (tipe === 'paragraf') { descText = document.getElementById('exp-desc').value || ""; } 
    else { document.querySelectorAll('.input-poin-item').forEach(inp => { if(inp.value.trim() !== "") arrPoin.push(inp.value.trim()); }); }

    const payload = {
        judul: judul, tipe: tipe, deskripsi: descText, poin_array: arrPoin,
        link: document.getElementById('exp-link').value || "", bukti_file_url: document.getElementById('exp-file').value || ""
    };

    if (editStateId.exp !== null) {
        dbData.pengalaman[editStateId.exp] = payload;
    } else {
        dbData.pengalaman.push(payload);
    }
    saveToLocalStorage(); resetForm('exp'); renderSemua();
});

function renderPengalaman() {
    const pubGrid = document.getElementById('tampil-pengalaman');
    const adminList = document.getElementById('admin-list-exp');
    pubGrid.innerHTML = ""; adminList.innerHTML = "";

    dbData.pengalaman.forEach((data, index) => {
        // --- PUBLIC UI ---
        const card = document.createElement('div'); card.className = "exp-card";
        const imgUrl = data.bukti_file_url ? data.bukti_file_url : "https://via.placeholder.com/300x160?text=Tidak+Ada+Gambar";
        
        let contentHTML = "";
        if (data.tipe === 'poin' && data.poin_array) {
            contentHTML = `<ul style="padding-left:20px;">${data.poin_array.map(p => `<li>${p}</li>`).join('')}</ul>`;
        } else { contentHTML = `<p>${data.deskripsi || ""}</p>`; }

        card.innerHTML = `
            <div class="exp-frame"><img src="${imgUrl}" onerror="this.src='https://via.placeholder.com/300x160?text=Format+Bukan+Gambar'"></div>
            <div class="exp-content" style="display:flex; align-items:center; justify-content:center;">
                <h3 style="font-size:16px; font-weight:700; color:var(--nav-color); text-align:center; margin:0;">${data.judul}</h3>
            </div>
        `;
        
        card.onclick = () => {
            document.getElementById('modal-exp-img').src = imgUrl;
            document.getElementById('modal-exp-title').innerText = data.judul;
            document.getElementById('modal-exp-desc').innerHTML = contentHTML;
            const linkBtn = document.getElementById('modal-exp-link');
            if(data.link && data.link.trim() !== "") {
                linkBtn.href = data.link; linkBtn.style.display = 'inline-block';
            } else { linkBtn.style.display = 'none'; }
            expModal.classList.remove('hidden');
        };
        pubGrid.appendChild(card);

        // --- ADMIN UI ---
        const adm = document.createElement('div');
        adm.className = "admin-list-item"; adm.setAttribute('draggable', true); adm.setAttribute('data-index', index);
        adm.innerHTML = `
            <div class="admin-list-content">
                <div class="drag-handle">☰</div>
                <div><strong style="color:var(--nav-color);">${data.judul}</strong> <br> <small>Tipe: ${data.tipe}</small></div>
            </div>
            <div>
                <button class="btn-edit" style="margin-right:5px;">Edit</button>
                <button class="btn-hapus">Hapus</button>
            </div>
        `;
        adm.querySelector('.btn-edit').onclick = () => {
            resetForm('exp'); 
            document.getElementById('exp-judul').value = data.judul; document.getElementById('exp-link').value = data.link || "";
            document.getElementById('exp-file').value = data.bukti_file_url || ""; document.getElementById('exp-tipe-desc').value = data.tipe || "paragraf";
            if(data.tipe === 'poin') {
                document.getElementById('exp-desc').classList.add('hidden'); document.getElementById('exp-poin-wrapper').classList.remove('hidden');
                const cont = document.getElementById('exp-poin-container');
                if(data.poin_array) {
                    data.poin_array.forEach(pt => {
                        const wrap = document.createElement('div'); wrap.style.display = "flex"; wrap.style.marginBottom = "8px"; wrap.style.gap = "10px";
                        wrap.innerHTML = `<input type="text" class="input-poin-item" value="${pt}" style="margin:0;"><button class="btn-hapus" style="margin:0;" onclick="this.parentElement.remove()">X</button>`;
                        cont.appendChild(wrap);
                    });
                }
            } else { document.getElementById('exp-desc').value = data.deskripsi || ""; }
            
            editStateId.exp = index;
            document.getElementById('btn-tambah-exp').innerText = 'Simpan Perubahan';
            document.getElementById('btn-batal-edit-exp').classList.remove('hidden');
            window.scrollTo(0, document.getElementById('exp-judul').offsetTop - 100);
        };
        adm.querySelector('.btn-hapus').onclick = () => { 
            if(confirm(`Yakin ingin menghapus ${data.judul}?`)) { 
                dbData.pengalaman.splice(index, 1); saveToLocalStorage(); renderSemua(); 
            } 
        };
        adminList.appendChild(adm);
    });

    enableDragAndDropLocal('admin-list-exp', dbData.pengalaman, renderSemua);
}

// ==========================================
// INISIALISASI PERTAMA KALI
// ==========================================
window.onload = () => {
    initData();
};