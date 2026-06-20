// ========================================
// admin.js (Quản lý Admin & Phân quyền)
// ========================================

function checkLoginStatus() {
    const activeSession = localStorage.getItem('busmap_current_session');
    const activeRole = localStorage.getItem('busmap_current_role');
    
    if (activeSession) {
        if (activeRole === 'admin') {
            isAdmin = true;
            document.getElementById('tabAdmin').style.display = 'block'; 
        }
        updateHeaderAuth(activeSession, activeRole);
    }
}

function updateHeaderAuth(user, role) {
    document.getElementById('authBtn').style.display = 'none'; 
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        let roleBadge = role === 'admin' ? '[Quản Trị Viên]' : '';
        userInfo.style.display = 'inline-block';
        userInfo.innerHTML = `Xin chào, <b>${user}</b> <span style="color:#ffd700">${roleBadge}</span> | <a href="#" id="btnLogout" style="color:#ffcccc; text-decoration:none; margin-left:5px;">Đăng xuất</a>`;
        document.getElementById('btnLogout').addEventListener('click', function(e) {
            e.preventDefault(); 
            if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                localStorage.removeItem('busmap_current_session');
                localStorage.removeItem('busmap_current_role');
                location.reload();
            }
        });
    }
}

function adminAddBus() {
    const id = document.getElementById('adminId').value.trim();
    const name = document.getElementById('adminName').value.trim();
    const price = document.getElementById('adminPrice').value.trim();
    const time = document.getElementById('adminTime').value.trim();
    const outStr = document.getElementById('adminOutbound').value;
    const inStr = document.getElementById('adminInbound').value;

    if (!id || !name) { alert("⚠️ Số tuyến và Tên tuyến không được bỏ trống!"); return; }

    const outArr = outStr.split(',').map(s => s.trim()).filter(s => s !== '');
    const inArr = inStr.split(',').map(s => s.trim()).filter(s => s !== '');

    const newBus = { id, name, price, time, distance: "Đang cập nhật", interval: "Đang cập nhật", outbound: outArr, inbound: inArr };

    const existIndex = db.findIndex(b => b.id === id);
    if (existIndex !== -1) {
        if (confirm("Tuyến này đã tồn tại! Ghi đè dữ liệu mới?")) db[existIndex] = newBus;
        else return;
    } else {
        db.unshift(newBus);
    }

    localStorage.setItem('busmap_db', JSON.stringify(db));
    alert("✅ Lưu tuyến xe thành công!");
    
    document.querySelectorAll('#adminForm input, #adminForm textarea').forEach(el => el.value = '');
    renderBusList(db, 'Danh sách các tuyến xe buýt (Kho dữ liệu)');
}

function adminDeleteBus(busId, event) {
    event.stopPropagation(); 
    if (confirm(`⚠️ Bạn có chắc muốn XÓA VĨNH VIỄN tuyến [${busId}] không?`)) {
        db = db.filter(b => b.id !== busId);
        localStorage.setItem('busmap_db', JSON.stringify(db)); 
        renderBusList(db, 'Danh sách các tuyến xe buýt (Kho dữ liệu)');
    }
}