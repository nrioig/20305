document.addEventListener('DOMContentLoaded', () => {
    const GITHUB_USERNAME = 'nrioig'; // TODO: 본인 깃허브 아이디로 변경하세요!
    fetchRepos(GITHUB_USERNAME);
});

async function fetchRepos(username) {
    const loader = document.getElementById('loader');
    const container = document.getElementById('repo-list');
    
    try {
        const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=12`);
        if(!res.ok) throw new Error('데이터를 불러오지 못했습니다.');
        
        const repos = await res.json();
        loader.style.display = 'none';
        
        repos.forEach(repo => {
            const card = document.createElement('a');
            card.href = repo.html_url;
            card.target = "_blank";
            card.className = 'card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';
            
            card.innerHTML = `
                <div>
                    <h3 style="color:var(--accent-lime); margin-bottom:10px;">${repo.name}</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        ${repo.description || '설명이 없습니다.'}
                    </p>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                    ${repo.language ? `<span class="tag">${repo.language}</span>` : '<span></span>'}
                    <span style="color:#aaa;">⭐ ${repo.stargazers_count}</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        loader.style.display = 'none';
        container.innerHTML = '<p style="color:#ff4747;">깃허브 데이터를 불러오는데 실패했습니다.</p>';
    }
}