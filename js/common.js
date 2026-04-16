document.addEventListener("DOMContentLoaded", () => {
    injectAuthModals(); // 로그인/가입 팝업을 모든 페이지에 자동 삽입!
    renderNavigation();
    bindModalEvents();
});

// 자동 팝업 생성기
function injectAuthModals() {
    if(document.getElementById('modal-login')) return;
    const modals = `
        <div id="modal-login" class="modal-overlay">
            <div class="modal-box">
                <div class="modal-header"><h3>로그인</h3><button class="close-btn" onclick="closeModal('modal-login')">&times;</button></div>
                <div class="modal-body">
                    <form id="login-form">
                        <input type="email" name="login_email" placeholder="이메일" required>
                        <input type="password" name="login_password" placeholder="비밀번호" required>
                        <p id="login-error" class="error-msg"></p>
                        <button type="submit" class="btn-primary" style="width:100%">로그인</button>
                    </form>
                    <p style="text-align:center; margin-top:15px; font-size:0.9rem;">계정이 없으신가요? <a href="#" onclick="switchModal('modal-login', 'modal-register'); return false;">회원가입</a></p>
                </div>
            </div>
        </div>
        <div id="modal-register" class="modal-overlay">
            <div class="modal-box">
                <div class="modal-header"><h3>회원가입</h3><button class="close-btn" onclick="closeModal('modal-register')">&times;</button></div>
                <div class="modal-body">
                    <form id="register-form">
                        <input type="text" name="reg_name" placeholder="닉네임" required>
                        <input type="email" name="reg_email" placeholder="이메일" required>
                        <input type="password" name="reg_pw" placeholder="비밀번호 (6자리 이상)" required minlength="6">
                        <input type="password" name="reg_pw_confirm" placeholder="비밀번호 확인" required minlength="6">
                        <p id="reg-error" class="error-msg"></p>
                        <button type="submit" class="btn-primary" style="width:100%">가입하기</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modals);
}

async function renderNavigation() {
    const header = document.querySelector('header');
    if(!header) return;

    const path = window.location.pathname;
    const { data: { session } } = await sb.auth.getSession();
    
    header.innerHTML = `
        <div class="container nav-inner">
            <a href="index.html" class="logo">User.dev</a>
            <ul class="nav-menu">
                <li><a href="index.html" class="${path.endsWith('index.html') || path === '/' ? 'active' : ''}">홈</a></li>
                <li><a href="board.html" class="${path.endsWith('board.html') ? 'active' : ''}">게시판</a></li>
                <li><a href="til.html" class="${path.endsWith('til.html') ? 'active' : ''}">공부기록</a></li>
                <li><a href="github.html" class="${path.endsWith('github.html') ? 'active' : ''}">GitHub</a></li>
                ${session ? `<li><a href="#" id="nav-logout">로그아웃</a></li>` : `<li><a href="#" onclick="openModal('modal-login'); return false;">로그인</a></li>`}
            </ul>
        </div>
    `;

    if(session) {
        document.getElementById('nav-logout').addEventListener('click', async (e) => {
            e.preventDefault();
            await sb.auth.signOut();
            window.location.reload();
        });
    }
}

async function getUser() {
    const { data: { user } } = await sb.auth.getUser();
    return user;
}

function openModal(modalId) { document.getElementById(modalId)?.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('active'); document.body.style.overflow = 'auto'; }
function switchModal(closeId, openId) { closeModal(closeId); setTimeout(() => openModal(openId), 200); }

function bindModalEvents() {
    document.addEventListener('mousedown', (e) => { if(e.target.classList.contains('modal-overlay')) closeModal(e.target.id); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') { const active = document.querySelector('.modal-overlay.active'); if(active) closeModal(active.id); } });
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container') || Object.assign(document.createElement('div'), {className: 'toast-container'});
    document.body.appendChild(container);
    const toast = Object.assign(document.createElement('div'), {className: `toast ${type}`, innerText: message});
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}