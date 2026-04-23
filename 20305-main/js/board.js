let currentPosts = [];
let loggedInUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await sb.auth.getUser();
    loggedInUser = user;

    loadPosts();

    document.getElementById('btn-add-post').addEventListener('click', () => {
        document.getElementById('board-write-form').reset();
        
        const authorWrapper = document.getElementById('board-author-wrapper');
        if (loggedInUser) {
            authorWrapper.style.display = 'none';
        } else {
            authorWrapper.style.display = 'block';
        }
        
        openModal('modal-board-write');
    });

    document.getElementById('board-write-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('board-title').value;
        const content = document.getElementById('board-content').value;
        const submitBtn = document.getElementById('btn-submit-write');
        
        let author_id = null;
        let author_name = '익명';

        if (loggedInUser) {
            author_id = loggedInUser.id;
            author_name = loggedInUser.user_metadata?.username || '회원';
        } else {
            const inputName = document.getElementById('board-author-name').value.trim();
            if (inputName) author_name = inputName;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = '등록 중...';

            await sb.from('posts').insert({
                title,
                content,
                author_id,
                author_name
            });

            closeModal('modal-board-write');
            showToast('게시글이 등록되었습니다.');
            loadPosts();
        } catch (error) {
            console.error(error);
            showToast('등록에 실패했습니다.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = '등록하기';
        }
    });

    document.getElementById('board-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-board-id').value;
        const title = document.getElementById('edit-board-title').value;
        const content = document.getElementById('edit-board-content').value;
        const submitBtn = document.getElementById('btn-submit-edit');

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = '수정 중...';

            await sb.from('posts').update({ title, content }).eq('id', id);

            closeModal('modal-board-edit');
            showToast('게시글이 수정되었습니다.');
            
            closeModal('modal-board-detail');
            loadPosts();
        } catch (error) {
            console.error(error);
            showToast('수정에 실패했습니다.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = '수정완료';
        }
    });
});

async function loadPosts() {
    const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('목록 불러오기 실패:', error);
        return;
    }

    currentPosts = data;
    const tbody = document.getElementById('board-list');
    tbody.innerHTML = '';

    data.forEach(post => {
        const tr = document.createElement('tr');
        tr.onclick = () => openDetail(post.id);
        
        const displayName = post.author_id ? post.author_name : `${post.author_name} (비회원)`;
        const dateStr = new Date(post.created_at).toLocaleDateString();

        tr.innerHTML = `
            <td>${post.title}</td>
            <td>${displayName}</td>
            <td>${dateStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

const canDelete = (post) => {
    if (!post.author_id) return true;
    return post.author_id === loggedInUser?.id;
};

const canEdit = (post) => {
    if (!post.author_id) return false;
    return post.author_id === loggedInUser?.id;
};

function openDetail(id) {
    const post = currentPosts.find(p => p.id === id);
    if (!post) return;

    const displayName = post.author_id ? post.author_name : `${post.author_name} (비회원)`;
    
    document.getElementById('detail-title').innerText = post.title;
    document.getElementById('detail-meta').innerText = `${displayName} | ${new Date(post.created_at).toLocaleString()}`;
    document.getElementById('detail-content').innerText = post.content;

    const btnEdit = document.getElementById('btn-edit-post');
    const btnDelete = document.getElementById('btn-delete-post');

    if (canEdit(post)) {
        btnEdit.style.display = 'inline-block';
        btnEdit.onclick = () => {
            document.getElementById('edit-board-id').value = post.id;
            document.getElementById('edit-board-title').value = post.title;
            document.getElementById('edit-board-content').value = post.content;
            openModal('modal-board-edit');
        };
    } else {
        btnEdit.style.display = 'none';
    }

    if (canDelete(post)) {
        btnDelete.style.display = 'inline-block';
        btnDelete.onclick = () => deletePost(post.id);
    } else {
        btnDelete.style.display = 'none';
    }

    openModal('modal-board-detail');
}

async function deletePost(id) {
    if (!confirm('이 게시글을 정말 삭제하시겠습니까?')) return;

    try {
        const { error } = await sb.from('posts').delete().eq('id', id);
        if (error) throw error;
        
        showToast('삭제되었습니다.');
        closeModal('modal-board-detail');
        loadPosts();
    } catch (error) {
        console.error(error);
        showToast('삭제 중 오류가 발생했습니다. 권한이 없습니다.', 'error');
    }
}