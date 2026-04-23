let currentFilter = '전체';
let loggedInUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await getUser();
    if(user) loggedInUserId = user.id;

    loadData();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.tag;
            loadData();
        });
    });

    document.getElementById('btn-add-til').addEventListener('click', () => {
        if(!loggedInUserId) { openModal('modal-login'); return; }
        document.getElementById('til-form').reset();
        document.getElementById('til-date').value = new Date().toLocaleDateString();
        openModal('modal-til-write');
    });
    const ADMIN_EMAIL = 'admin@admin.com'; // ⭐️ 여기를 꼭 수정하세요!
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

let currentFilter = '전체';
let currentPosts = [];
let isAdmin = false;
let loggedInUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAdmin();
    
    if(isAdmin) {
        document.getElementById('btn-add-til').style.display = 'block';
    }

    loadData();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.tag;
            loadData();
        });
    });

    document.getElementById('btn-add-til').addEventListener('click', () => {
        document.getElementById('til-form').reset();
        document.getElementById('til-date').value = new Date().toLocaleDateString();
        document.getElementById('til-image-preview').style.display = 'none';
        document.getElementById('til-image-preview').src = '';
        openModal('modal-til-write');
    });

    bindImagePreview('til-image', 'til-image-preview');
    bindImagePreview('edit-til-image', 'edit-til-image-preview');

    document.getElementById('til-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tag = document.getElementById('til-tag').value;
        const content = document.getElementById('til-content').value;
        const fileInput = document.getElementById('til-image');
        const submitBtn = document.getElementById('btn-submit-write');

        try {
            submitBtn.innerText = '업로드 중...';
            submitBtn.disabled = true;

            let imageUrl = null;
            if (fileInput.files && fileInput.files[0]) {
                imageUrl = await uploadImage(fileInput.files[0]);
            }

            await sb.from('tils').insert({ 
                content, 
                tag, 
                image_url: imageUrl, 
                author_id: loggedInUser.id, 
                author_name: loggedInUser.user_metadata.username || 'Admin' 
            });

            closeModal('modal-til-write');
            showToast('기록되었습니다.');
            loadData();
        } catch (error) {
            console.error(error);
            showToast('업로드에 실패했습니다. (권한을 확인하세요)', 'error');
        } finally {
            submitBtn.innerText = '기록하기';
            submitBtn.disabled = false;
        }
    });

    document.getElementById('til-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-til-id').value;
        const oldImageUrl = document.getElementById('edit-old-image-url').value;
        const tag = document.getElementById('edit-til-tag').value;
        const content = document.getElementById('edit-til-content').value;
        const fileInput = document.getElementById('edit-til-image');
        const submitBtn = document.getElementById('btn-submit-edit');

        try {
            submitBtn.innerText = '수정 중...';
            submitBtn.disabled = true;

            let finalImageUrl = oldImageUrl || null;

            if (fileInput.files && fileInput.files[0]) {
                if (oldImageUrl) await deleteStorageImage(oldImageUrl);
                finalImageUrl = await uploadImage(fileInput.files[0]);
            }

            await sb.from('tils').update({ content, tag, image_url: finalImageUrl }).eq('id', id);

            closeModal('modal-til-edit');
            showToast('수정되었습니다.');
            loadData();
        } catch (error) {
            console.error(error);
            showToast('수정에 실패했습니다.', 'error');
        } finally {
            submitBtn.innerText = '수정완료';
            submitBtn.disabled = false;
        }
    });
});

async function checkAdmin() {
    const { data: { user } } = await sb.auth.getUser();
    if(user) {
        loggedInUser = user;
        isAdmin = (user.email === ADMIN_EMAIL);
    }
    return isAdmin;
}

async function uploadImage(file) {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) {
        showToast("이미지는 5MB 이하만 가능합니다.", "error");
        throw new Error("File too large");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await sb.storage.from('til-images').upload(fileName, file);
    if (error) throw error;

    const { data: publicUrlData } = sb.storage.from('til-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
}

async function deleteStorageImage(url) {
    if (!url) return;
    const parts = url.split('/til-images/');
    if (parts.length > 1) {
        const filePath = parts[1];
        await sb.storage.from('til-images').remove([filePath]);
    }
}

function bindImagePreview(inputId, imgId) {
    document.getElementById(inputId).addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById(imgId);
        
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                showToast("이미지는 5MB 이하만 가능합니다.", "error");
                e.target.value = "";
                preview.style.display = 'none';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            preview.src = '';
        }
    });
}

async function loadData() {
    let query = sb.from('tils').select('*').order('created_at', { ascending: false });
    if(currentFilter !== '전체') query = query.eq('tag', currentFilter);
    
    const { data, error } = await query;
    if(error) return;

    currentPosts = data;
    const container = document.getElementById('til-list');
    container.innerHTML = '';
    
    data.forEach(til => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const adminButtons = isAdmin ? `
            <div>
                <button onclick="openEditTil('${til.id}')" class="btn-secondary" style="padding: 2px 8px; font-size: 0.8rem; margin-right:5px;">수정</button>
                <button onclick="deleteTil('${til.id}', '${til.image_url || ''}')" class="btn-danger" style="padding: 2px 8px; font-size: 0.8rem;">삭제</button>
            </div>
        ` : '';

        const imageHtml = til.image_url ? `<img src="${til.image_url}" class="til-image" alt="TIL 이미지">` : '';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <span class="tag">${til.tag}</span>
                ${adminButtons}
            </div>
            ${imageHtml}
            <p style="white-space:pre-wrap; margin: 15px 0;">${til.content}</p>
            <div style="text-align:right; font-size:0.8rem; color:var(--text-muted);">
                ${til.author_name} | ${new Date(til.created_at).toLocaleDateString()}
            </div>
        `;
        container.appendChild(card);
    });
}

function openEditTil(id) {
    const til = currentPosts.find(p => p.id === id);
    if(!til) return;

    document.getElementById('edit-til-id').value = til.id;
    document.getElementById('edit-old-image-url').value = til.image_url || '';
    document.getElementById('edit-til-tag').value = til.tag;
    document.getElementById('edit-til-content').value = til.content;
    document.getElementById('edit-til-image').value = '';

    const preview = document.getElementById('edit-til-image-preview');
    if (til.image_url) {
        preview.src = til.image_url;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }

    openModal('modal-til-edit');
}

async function deleteTil(id, imageUrl) {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        if (imageUrl) {
            await deleteStorageImage(imageUrl);
        }
        await sb.from('tils').delete().eq('id', id);
        
        showToast('삭제되었습니다.');
        loadData();
    } catch (error) {
        console.error(error);
        showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
}

    document.getElementById('til-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tag = document.getElementById('til-tag').value;
        const content = document.getElementById('til-content').value;
        const user = await getUser();

        await sb.from('tils').insert({ tag, content, author_id: user.id, author_name: user.user_metadata.username || 'User' });
        closeModal('modal-til-write');
        showToast('기록되었습니다.');
        loadData();
    });
});

async function loadData() {
    let query = sb.from('tils').select('*').order('created_at', { ascending: false });
    if(currentFilter !== '전체') query = query.eq('tag', currentFilter);
    
    const { data, error } = await query;
    if(error) return;

    const container = document.getElementById('til-list');
    container.innerHTML = '';
    data.forEach(til => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="tag">${til.tag}</span>
                ${loggedInUserId === til.author_id ? `<button onclick="deleteTil('${til.id}')" class="btn-danger" style="padding: 2px 8px; font-size: 0.8rem;">삭제</button>` : ''}
            </div>
            <p style="white-space:pre-wrap; margin: 15px 0;">${til.content}</p>
            <div style="text-align:right; font-size:0.8rem; color:var(--text-muted);">
                ${til.author_name} | ${new Date(til.created_at).toLocaleDateString()}
            </div>
        `;
        container.appendChild(card);
    });
}

async function deleteTil(id) {
    if(!confirm('삭제하시겠습니까?')) return;
    await sb.from('tils').delete().eq('id', id);
    showToast('삭제되었습니다.');
    loadData();
}