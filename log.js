let isLoginMode = true;

window.onload = function() {
    // Tự động tạo 1 tài khoản Admin mặc định để test
    initDefaultAdmin();

    // Sự kiện cho Form Hành khách / Đăng ký
    document.getElementById('tabLogin').addEventListener('click', () => switchAuthMode(true));
    document.getElementById('tabRegister').addEventListener('click', () => switchAuthMode(false));
    document.getElementById('submitAuthBtn').addEventListener('click', handleAuth);

    // Sự kiện bật/tắt Modal Admin
    document.getElementById('openAdminModal').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('adminModal').style.display = 'flex';
    });
    
    const closeModal = () => document.getElementById('adminModal').style.display = 'none';
    document.getElementById('closeAdminModal').addEventListener('click', closeModal);
    document.getElementById('cancelAdminModal').addEventListener('click', closeModal);

    // Sự kiện Đăng nhập cho Form Admin
    document.getElementById('submitAdminAuthBtn').addEventListener('click', handleAdminAuth);
};

// Tạo tài khoản Admin mặc định để test (admin / 1234)
function initDefaultAdmin() {
    let usersList = JSON.parse(localStorage.getItem('busmap_users_list')) || [];
    const hasAdmin = usersList.some(u => u.role === 'admin');
    if (!hasAdmin) {
        usersList.push({ username: 'admin', password: '1234', role: 'admin' });
        localStorage.setItem('busmap_users_list', JSON.stringify(usersList));
    }
}

// ----------------------------------------
// LOGIC CHO HÀNH KHÁCH VÀ ĐĂNG KÝ
// ----------------------------------------
function switchAuthMode(toLogin) {
    isLoginMode = toLogin;
    
    document.getElementById('tabLogin').className = isLoginMode ? 'auth-tab active' : 'auth-tab';
    document.getElementById('tabRegister').className = !isLoginMode ? 'auth-tab active' : 'auth-tab';
    
    // Ẩn/Hiện các field đăng ký, BAO GỒM CẢ ROLE GROUP
    document.getElementById('emailGroup').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('confirmPasswordGroup').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('roleGroup').style.display = isLoginMode ? 'none' : 'block';
    
    document.getElementById('username').placeholder = isLoginMode ? 'Tên tài khoản' : 'Tạo tên tài khoản';
    document.getElementById('password').placeholder = isLoginMode ? 'Mật khẩu' : 'Tạo mật khẩu';
    document.getElementById('submitAuthBtn').textContent = isLoginMode ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN';
    
    // Reset data
    document.getElementById('username').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('roleSelect').value = 'user'; // Đưa vai trò về mặc định
}

function handleAuth() {
    const user = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value?.trim() || '';
    const pass = document.getElementById('password').value.trim();
    const confirmPass = document.getElementById('confirmPassword').value?.trim() || '';
    
    // Nếu đang đăng nhập, auto coi là user. Nếu đang đăng ký, lấy từ ô chọn Vai Trò
    const role = isLoginMode ? 'user' : document.getElementById('roleSelect').value;

    if (isLoginMode) {
        if (user === '' || pass === '') { alert("⚠️ Vui lòng nhập đầy đủ thông tin!"); return; }
    } else {
        if (user === '' || email === '' || pass === '' || confirmPass === '') { alert("⚠️ Vui lòng điền đủ thông tin!"); return; }
        if (pass !== confirmPass) { alert("⚠️ Mật khẩu xác nhận không khớp!"); return; }
        if (pass.length < 4) { alert("⚠️ Mật khẩu quá ngắn!"); return; }
    }

    let usersList = JSON.parse(localStorage.getItem('busmap_users_list')) || [];

    if (isLoginMode) { 
        // Logic khi Đăng Nhập ở form ngoài
        const matchedUser = usersList.find(u => u.username === user && u.password === pass);
        if (matchedUser) {
            // Chặn Admin đăng nhập ở cổng này
            if (matchedUser.role !== 'user') {
                alert(`❌ Tài khoản này là Quản trị viên! Vui lòng chọn đăng nhập Quản trị viên.`);
                return;
            }
            alert('✅ Đăng nhập Hành khách thành công!'); 
            localStorage.setItem('busmap_current_session', user);
            localStorage.setItem('busmap_current_role', 'user');
            window.location.href = 'index.html';
        } else {
            alert('❌ Sai tên đăng nhập hoặc mật khẩu!');
        }
    } else { 
        // Logic khi Đăng Ký
        const isUserExists = usersList.some(u => u.username === user);
        if (isUserExists) {
            alert('⚠️ Tên đăng nhập đã tồn tại!');
        } else {
            usersList.push({ username: user, email: email, password: pass, role: role });
            localStorage.setItem('busmap_users_list', JSON.stringify(usersList));
            
            // Hiện thông báo riêng cho từng loại tài khoản vừa tạo
            const roleName = role === 'admin' ? 'Quản trị viên' : 'Hành khách';
            alert(`✅ Tạo tài khoản ${roleName} thành công!`);
            switchAuthMode(true);
        }
    }
}

// ----------------------------------------
// LOGIC CHO QUẢN TRỊ VIÊN (MODAL POPUP)
// ----------------------------------------
function handleAdminAuth() {
    const adminUser = document.getElementById('adminUsername').value.trim();
    const adminPass = document.getElementById('adminPassword').value.trim();

    if (adminUser === '' || adminPass === '') { 
        alert("⚠️ Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!"); 
        return; 
    }

    let usersList = JSON.parse(localStorage.getItem('busmap_users_list')) || [];
    const matchedUser = usersList.find(u => u.username === adminUser && u.password === adminPass);

    if (matchedUser) {
        if (matchedUser.role !== 'admin') {
            alert(`❌ Tài khoản này không có quyền Quản trị viên!`);
            return;
        }
        alert('✅ Đăng nhập Quản trị viên thành công!'); 
        localStorage.setItem('busmap_current_session', adminUser);
        localStorage.setItem('busmap_current_role', 'admin');
        window.location.href = 'index.html';
    } else {
        alert('❌ Sai tên đăng nhập hoặc mật khẩu quản trị!');
    }
}