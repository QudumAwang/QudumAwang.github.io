console.log("Memulai Web Portofolio (Git-Backed CMS)...");

// ==========================================
// 1. KONFIGURASI GITHUB API
// ==========================================
const GITHUB_USERNAME = "QudumAwang"; 
const GITHUB_REPO = "QudumAwang.github.io";     
const FILE_PATH = "data.json";        

// Database lokal di memori
let dbData = { profil: {}, pendidikan: [], skills: [], pengalaman: [] };
let fileSha = ""; 
let editStateId = { edu: null, skill: null, exp: null };
let GITHUB_TOKEN = sessionStorage.getItem('adminToken') || null;


// ==========================================
// 2. FUNGSI FETCH CEPAT (CACHE SESSION)
// ==========================================
async function fetchFromGitHub() {
    // PERBAIKAN KINERJA: Cek apakah data sudah ada di Session Storage
    const cachedData = sessionStorage.getItem('portfolioCacheData');
    const cachedSha = sessionStorage.getItem('portfolioCacheSha');

    // Jika admin tidak login, dan cache ada, langsung pakai cache agar kilat!
    if (cachedData && cachedSha && !GITHUB_TOKEN) {
        console.log("Data dimuat INSTAN dari Cache Browser.");
        dbData = JSON.parse(cachedData);
        fileSha = cachedSha;
        renderSemua();
        return;
    }

    try {
        console.log("Mendownload data terbaru dari GitHub...");
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${FILE_PATH}?t=${new Date().getTime()}`;
        
        const response = await fetch(url, {
            headers: GITHUB_TOKEN ? { "Authorization": `token ${GITHUB_TOKEN}` } : {}
        });

        if (response.ok) {
            const data = await response.json();
            fileSha = data.sha; 
            
            const decodedContent = decodeURIComponent(escape(atob(data.content)));
            dbData = JSON.parse(decodedContent);
            
            // Simpan ke Cache agar navigasi selanjutnya kilat
            sessionStorage.setItem('portfolioCacheData', JSON.stringify(dbData));
            sessionStorage.setItem('portfolioCacheSha', fileSha);
            
            console.log("Data berhasil ditarik dari GitHub.");
        } else if (response.status === 404) {
            console.warn("File data.json belum ada di GitHub. Akan dibuat saat pertama kali simpan.");
        } else {
            console.error("Gagal menarik data dari GitHub:", response.status);
        }
    } catch (e) {
        console.error("Error Fetch GitHub API:", e);
    }
    renderSemua();
}

async function pushToGitHub() {
    if (!GITHUB_TOKEN) return alert("Belum Login Admin!");

    if (!fileSha) {
        await fetchFromGitHub();
    }

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const payload = {
        message: "Update portofolio via Admin Dashboard",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(dbData, null, 4)))),
        sha: fileSha 
    };

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            fileSha = result.content.sha; 
            // Hapus cache lokal agar fetch selanjutnya ambil data baru
            sessionStorage.removeItem('portfolioCacheData'); 
            alert("Data berhasil tersimpan ke GitHub!");
            return true;
        } else {
            console.error("Gagal Push GitHub:", result);
            alert("Gagal Push! Pesan: " + result.message);
            return false;
        }
    } catch (e) {
        alert("Gagal koneksi ke GitHub saat menyimpan.");
        return false;
    }
}


// ==========================================
// 3. LOGIKA UI & SISTEM LOGIN GITHUB
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

if (GITHUB_TOKEN) { setAdminMode(true); } else { setAdminMode(false); }

function setAdminMode(isLoggedIn) {
    if (isLoggedIn) {
        btnToggleAdmin.classList.remove('hidden'); btnLogout.classList.remove('hidden');
        document.body.classList.add('is-admin'); profileDropdown.classList.add('hidden');
        document.getElementById('btn-show-login-modal').classList.add('hidden'); // Sembunyikan tombol login d dropdown
    } else {
        btnToggleAdmin.classList.add('hidden'); btnLogout.classList.add('hidden');
        adminLayout.classList.add('hidden'); publicLayout.classList.remove('hidden');
        document.body.classList.remove('is-admin');
        document.getElementById('btn-show-login-modal').classList.remove('hidden');
    }
}

topbarFoto.addEventListener('click', () => { profileDropdown.classList.toggle('hidden'); });
btnShowLoginModal.addEventListener('click', () => { profileDropdown.classList.add('hidden'); loginOverlay.classList.remove('hidden'); });
btnCloseLoginModal.addEventListener('click', () => loginOverlay.classList.add('hidden'));

document.getElementById('toggle-password').addEventListener('click', function() {
    const passInput = document.getElementById('login-password');
    if(passInput.type === 'password') { passInput.type = 'text'; this.innerText = '🙈'; } 
    else { passInput.type = 'password'; this.innerText = '👁️'; }
});

document.getElementById('btn-login-submit').addEventListener('click', async () => {
    const token = document.getElementById('login-password').value; 
    
    if(!token.startsWith("ghp_")) {
        return alert("Format Token tidak valid. Pastikan berawalan 'ghp_'.");
    }

    try {
        const response = await fetch("https://api.github.com/user", {
            headers: { "Authorization": `token ${token}` }
        });
        
        if(response.ok) {
            GITHUB_TOKEN = token;
            sessionStorage.setItem('adminToken', token); 
            sessionStorage.removeItem('portfolioCacheData'); // Hapus cache agar mode admin bisa tulis data baru
            
            document.getElementById('login-password').value = '';
            loginOverlay.classList.add('hidden'); publicLayout.classList.add('hidden');
            adminLayout.classList.remove('hidden'); setAdminMode(true); window.scrollTo(0,0);
            
            fetchFromGitHub();
        } else {
            alert("Token GitHub Ditolak.");
        }
    } catch (e) {
        alert("Gagal koneksi ke GitHub API.");
    }
});

btnLogout.addEventListener('click', () => { 
    GITHUB_TOKEN = null; sessionStorage.removeItem('adminToken'); sessionStorage.removeItem('portfolioCacheData'); setAdminMode(false); alert("Berhasil Logout."); 
    location.reload(); // Refresh halaman untuk kembali ke awal
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

function enableDragAndDropArray(containerId, arrayData, renderCallback) {
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

    container.addEventListener('dragend', async (e) => {
        const draggedElement = document.querySelector('.dragging');
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            
            const newArray = [];
            const items = container.querySelectorAll('.admin-list-item');
            let urutanBerubah = false;
            
            items.forEach((item, index) => {
                const oldIndex = parseInt(item.getAttribute('data-index'));
                newArray.push(arrayData[oldIndex]);
                if(oldIndex !== index) urutanBerubah = true;
            });
            
            if (urutanBerubah) {
                arrayData.length = 0; arrayData.push(...newArray); 
                await pushToGitHub(); 
                renderCallback();
            }
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
// 4. LOGIKA CRUD (TIDAK ADA PERUBAHAN BESAR)
// ==========================================
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
    div.innerHTML = `<input type="text" class="link-nama" placeholder="Teks Link" style="width:35%; margin:0;"><input type="url" class="link-url" placeholder="URL Lengkap" style="width:55%; margin:0;"><button class="btn-hapus" style="margin:0;" onclick="this.parentElement.remove()">X</button>`;
    container.appendChild(div);
});

document.getElementById('btn-simpan-biodata').addEventListener('click', async () => {
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

    const sukses = await pushToGitHub();
    if(sukses) { renderSemua(); }
});

document.getElementById('btn-simpan-desc').addEventListener('click', async () => {
    dbData.profil.deskripsi = document.getElementById('desc-text').value || "";
    const sukses = await pushToGitHub();
    if(sukses) { renderSemua(); }
});

function renderBiodata() {
    const data = dbData.profil || {};
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

    // Atur Palet Jika Kosong (Gunakan bawaan Clean)
    const b1 = data.bg1 || '#ffffff'; const b2 = data.bg2 || '#f8fafc';
    const tc = data.text_color || '#334155'; const nc = data.nav_color || '#ffffff';
    const bc = data.btn_color || '#2563eb';

    document.documentElement.style.setProperty('--bg-color-1', b1);
    document.documentElement.style.setProperty('--bg-color-2', b2);
    document.documentElement.style.setProperty('--text-color', tc);
    document.documentElement.style.setProperty('--nav-color', nc);
    document.documentElement.style.setProperty('--btn-color', bc);

    // Sidebar Teks butuh penyesuaian jika background navbar putih
    if(nc === '#ffffff' || nc === '#fff') {
        document.documentElement.style.setProperty('--sidebar-text', '#334155');
    } else {
        document.documentElement.style.setProperty('--sidebar-text', '#ffffff');
    }

    document.getElementById('bio-nama').value = data.nama || ""; document.getElementById('bio-email').value = data.email || "";
    document.getElementById('bio-wa').value = data.wa || ""; document.getElementById('bio-foto-profil').value = data.foto_profil || "";
    document.getElementById('bio-foto-full').value = data.foto_full || "";
    document.getElementById('color-bg1').value = b1; document.getElementById('color-bg2').value = b2;
    document.getElementById('color-text').value = tc;
    document.getElementById('color-nav').value = nc; document.getElementById('color-btn').value = bc;
    document.getElementById('desc-text').value = data.deskripsi || "";
    document.getElementById('tampil-deskripsi').innerText = data.deskripsi || "Belum ada deskripsi.";

    const linkContainer = document.getElementById('link-dinamis-container');
    linkContainer.innerHTML = '<h4 style="margin-bottom: 10px; color:#d97706;">Links Eksternal</h4>';
    if(data.links && data.links.length > 0) {
        data.links.forEach(l => {
            const div = document.createElement('div');
            div.style.marginBottom = "8px"; div.style.display = "flex"; div.style.gap = "10px";
            div.innerHTML = `<input type="text" class="link-nama" value="${l.nama}" placeholder="Teks" style="width:35%; margin:0;"><input type="url" class="link-url" value="${l.url}" placeholder="URL" style="width:55%; margin:0;"><button class="btn-hapus" style="margin:0;" onclick="this.parentElement.remove()">X</button>`;
            linkContainer.appendChild(div);
        });
    }

    if(dbData.pendidikan && dbData.pendidikan.length > 0) {
        let arrGelar = dbData.pendidikan.filter(p => p.gelar && p.gelar.trim() !== "").map(p => p.gelar);
        if(arrGelar.length > 0) namaLengkap += ", " + arrGelar.join(", ");
    }
    document.getElementById('tampil-nama-besar').innerText = namaLengkap;
}

// --- PENDIDIKAN ---
document.getElementById('edu-masih-belajar').addEventListener('change', function() {
    document.getElementById('edu-lulus').disabled = this.checked;
});

document.getElementById('btn-tambah-edu').addEventListener('click', async () => {
    const instansi = document.getElementById('edu-instansi').value;
    if (!instansi) return alert("Asal Sekolah wajib diisi!");
    
    const payload = {
        instansi: instansi, gelar: document.getElementById('edu-gelar').value || "",
        lokasi: document.getElementById('edu-lokasi').value || "", jurusan: document.getElementById('edu-jurusan').value || "",
        ipk: document.getElementById('edu-ipk').value || "", mulai: document.getElementById('edu-mulai').value || "",
        lulus: document.getElementById('edu-masih-belajar').checked ? "Sekarang" : document.getElementById('edu-lulus').value,
        bukti_file_url: document.getElementById('edu-file').value || ""
    };

    if (editStateId.edu !== null) { dbData.pendidikan[editStateId.edu] = payload; } 
    else { dbData.pendidikan.push(payload); }
    
    const sukses = await pushToGitHub();
    if(sukses) { resetForm('edu'); renderSemua(); }
});

function renderPendidikan() {
    const pubContainer = document.getElementById('tampil-pendidikan');
    const adminContainer = document.getElementById('admin-list-edu');
    
    pubContainer.innerHTML = ""; adminContainer.innerHTML = "";
    if(!dbData.pendidikan) return;

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
            <div><button class="btn-edit" style="margin-right:5px;">Edit</button><button class="btn-hapus">Hapus</button></div>
        `;
        adm.querySelector('.btn-edit').onclick = () => {
            resetForm('edu'); 
            document.getElementById('edu-instansi').value = data.instansi; document.getElementById('edu-gelar').value = data.gelar || "";
            document.getElementById('edu-lokasi').value = data.lokasi || ""; document.getElementById('edu-jurusan').value = data.jurusan || "";
            document.getElementById('edu-ipk').value = data.ipk || ""; document.getElementById('edu-mulai').value = data.mulai || "";
            if(data.lulus === "Sekarang") { document.getElementById('edu-masih-belajar').checked = true; document.getElementById('edu-lulus').disabled = true; } 
            else { document.getElementById('edu-masih-belajar').checked = false; document.getElementById('edu-lulus').disabled = false; document.getElementById('edu-lulus').value = data.lulus || ""; }
            document.getElementById('edu-file').value = data.bukti_file_url || "";
            editStateId.edu = index; document.getElementById('btn-tambah-edu').innerText = 'Simpan Perubahan Data'; document.getElementById('btn-batal-edit-edu').classList.remove('hidden');
            window.scrollTo(0, document.getElementById('edu-instansi').offsetTop - 100);
        };
        adm.querySelector('.btn-hapus').onclick = async () => { 
            if(confirm(`Yakin ingin menghapus ${data.instansi}?`)) { dbData.pendidikan.splice(index, 1); const sukses = await pushToGitHub(); if(sukses) renderSemua(); } 
        };
        adminContainer.appendChild(adm);
    });
    enableDragAndDropArray('admin-list-edu', dbData.pendidikan, renderSemua);
}

// --- SKILLS ---
document.getElementById('btn-tambah-skill').addEventListener('click', async () => {
    const judul = document.getElementById('skill-judul').value;
    if (!judul) return alert("Nama skill wajib diisi!");
    const payload = { judul: judul, deskripsi: document.getElementById('skill-desc').value || "" };

    if (editStateId.skill !== null) { dbData.skills[editStateId.skill] = payload; } 
    else { dbData.skills.push(payload); }
    
    const sukses = await pushToGitHub();
    if(sukses) { resetForm('skill'); renderSemua(); }
});

function renderSkills() {
    const pubList = document.getElementById('tampil-skill');
    const adminList = document.getElementById('admin-list-skill');
    pubList.innerHTML = ""; adminList.innerHTML = "";
    if(!dbData.skills) return;

    dbData.skills.forEach((data, index) => {
        const li = document.createElement('li'); li.className = "skill-card"; li.innerHTML = `${data.judul}`; pubList.appendChild(li);

        const adm = document.createElement('div');
        adm.className = "admin-list-item"; adm.setAttribute('draggable', true); adm.setAttribute('data-index', index);
        adm.innerHTML = `
            <div class="admin-list-content"><div class="drag-handle">☰</div><div><strong style="color:var(--nav-color);">${data.judul}</strong></div></div>
            <div><button class="btn-edit" style="margin-right:5px;">Edit</button><button class="btn-hapus">Hapus</button></div>
        `;
        adm.querySelector('.btn-edit').onclick = () => {
            resetForm('skill');
            document.getElementById('skill-judul').value = data.judul; document.getElementById('skill-desc').value = data.deskripsi || "";
            editStateId.skill = index; document.getElementById('btn-tambah-skill').innerText = 'Simpan Perubahan'; document.getElementById('btn-batal-edit-skill').classList.remove('hidden'); window.scrollTo(0, document.getElementById('skill-judul').offsetTop - 100);
        };
        adm.querySelector('.btn-hapus').onclick = async () => { 
            if(confirm(`Yakin ingin menghapus ${data.judul}?`)) { dbData.skills.splice(index, 1); const sukses = await pushToGitHub(); if(sukses) renderSemua(); } 
        };
        adminList.appendChild(adm);
    });
    enableDragAndDropArray('admin-list-skill', dbData.skills, renderSemua);
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

document.getElementById('btn-tambah-exp').addEventListener('click', async () => {
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

    if (editStateId.exp !== null) { dbData.pengalaman[editStateId.exp] = payload; } 
    else { dbData.pengalaman.push(payload); }
    
    const sukses = await pushToGitHub();
    if(sukses) { resetForm('exp'); renderSemua(); }
});

function renderPengalaman() {
    const pubGrid = document.getElementById('tampil-pengalaman');
    const adminList = document.getElementById('admin-list-exp');
    pubGrid.innerHTML = ""; adminList.innerHTML = "";
    if(!dbData.pengalaman) return;

    dbData.pengalaman.forEach((data, index) => {
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

        const adm = document.createElement('div');
        adm.className = "admin-list-item"; adm.setAttribute('draggable', true); adm.setAttribute('data-index', index);
        adm.innerHTML = `
            <div class="admin-list-content"><div class="drag-handle">☰</div><div><strong style="color:var(--nav-color);">${data.judul}</strong> <br> <small>Tipe: ${data.tipe}</small></div></div>
            <div><button class="btn-edit" style="margin-right:5px;">Edit</button><button class="btn-hapus">Hapus</button></div>
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
            
            editStateId.exp = index; document.getElementById('btn-tambah-exp').innerText = 'Simpan Perubahan'; document.getElementById('btn-batal-edit-exp').classList.remove('hidden'); window.scrollTo(0, document.getElementById('exp-judul').offsetTop - 100);
        };
        adm.querySelector('.btn-hapus').onclick = async () => { 
            if(confirm(`Yakin ingin menghapus ${data.judul}?`)) { dbData.pengalaman.splice(index, 1); const sukses = await pushToGitHub(); if(sukses) renderSemua(); } 
        };
        adminList.appendChild(adm);
    });

    enableDragAndDropArray('admin-list-exp', dbData.pengalaman, renderSemua);
}

// ==========================================
// INISIALISASI PERTAMA KALI
// ==========================================
window.onload = () => {
    fetchFromGitHub();
};