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