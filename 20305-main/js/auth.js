// 동적으로 생성된 폼도 처리할 수 있도록 이벤트 위임 사용
document.addEventListener("submit", async (e) => {
    // 1. 로그인 폼 처리
    if (e.target.id === 'login-form') {
        e.preventDefault();
        const email = e.target.login_email.value;
        const password = e.target.login_password.value;
        const errorMsg = document.getElementById('login-error');
        errorMsg.style.display = 'none';

        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = "이메일 또는 비밀번호가 틀렸습니다.";
        } else {
            closeModal('modal-login');
            showToast("로그인되었습니다.");
            window.location.reload(); // 새로고침해서 상태 반영
        }
    }

    // 2. 회원가입 폼 처리
    if (e.target.id === 'register-form') {
        e.preventDefault();
        const email = e.target.reg_email.value;
        const username = e.target.reg_name.value;
        const password = e.target.reg_pw.value;
        const passwordConfirm = e.target.reg_pw_confirm.value;
        const errorMsg = document.getElementById('reg-error');
        errorMsg.style.display = 'none';

        if (password !== passwordConfirm) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = "비밀번호가 일치하지 않습니다.";
            return;
        }

        const { error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
        if (error) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = error.message;
        } else {
            closeModal('modal-register');
            showToast("가입이 완료되었습니다. 로그인해주세요!");
        }
    }
});