let currentPosts = [];

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('btn-write').addEventListener('click', async () => {
        const user = await getUser();
        if(!user) { openModal('modal-login'); return; }
        
        document.getElementById('board-form').reset();
        document.getElementById('board-id').value = '';
        document.getElementById('write-modal-title').innerText = '새 글 작성';
        openModal('modal-board-write');
    });

    document.getElementById('board-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = await getUser();
        const id = document.getElementById('board-id').value;
        const title = document.getElementById('board-title').value;
        const content = document.getElementById('board-content').value;

        if(id) {
            await sb.from('posts').update({ title, content, updated_at: new Date() }).eq('id', id);
            showToast("수정되었습니다.");
        } else {
            await sb.from('posts').insert({ title, content, author_id: user.id, author_name: user.user_metadata.username || 'User' });
            showToast("등록되었습니다.");
        }
        closeModal('modal-board-write');
        loadData();
    });
});

async function loadData() {
    const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false });
    if(error) return;
    currentPosts = data;
    
    const tbody = document.getElementById('board-list');
    tbody.innerHTML = '';
    data.forEach((post, i) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td>${data.length - i}</td><td>${post.title}</td><td>${post.author_name}</td><td>${new Date(post.created_at).toLocaleDateString()}</td>`;
        tr.onclick = () => openDetail(post.id);
        tbody.appendChild(tr);
    });
}

async function openDetail(id) {
    const post = currentPosts.find(p => p.id === id);
    if(!post) return;

    document.getElementById('detail-title').innerText = post.title;
    document.getElementById('detail-meta').innerText = `${post.author_name} | ${new Date(post.created_at).toLocaleString()}`;
    document.getElementById('detail-content').innerText = post.content;

    const user = await getUser();
    const footer = document.getElementById('detail-footer');
    footer.innerHTML = `<button class="btn-secondary" onclick="closeModal('modal-board-detail')">닫기</button>`;
    
    if(user && user.id === post.author_id) {
        footer.innerHTML += `<button class="btn-secondary" onclick="openEdit('${post.id}')">수정</button><button class="btn-danger" onclick="deletePost('${post.id}')">삭제</button>`;
    }
    openModal('modal-board-detail');
}

function openEdit(id) {
    const post = currentPosts.find(p => p.id === id);
    closeModal('modal-board-detail');
    document.getElementById('board-id').value = post.id;
    document.getElementById('board-title').value = post.title;
    document.getElementById('board-content').value = post.content;
    document.getElementById('write-modal-title').innerText = '글 수정';
    openModal('modal-board-write');
}

async function deletePost(id) {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    await sb.from('posts').delete().eq('id', id);
    closeModal('modal-board-detail');
    showToast("삭제되었습니다.");
    loadData();
}