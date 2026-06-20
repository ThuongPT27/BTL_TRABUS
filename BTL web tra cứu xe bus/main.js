// =====================================
//  main.js (Khởi tạo & Biến toàn cục)
// =====================================

// --- KHAI BÁO BIẾN DÙNG CHUNG CẢ HỆ THỐNG ---
let db = []; 
let isAdmin = false; 
let currentBusInfo = null;
let currentDirection = 'out'; 
let currentView = 'stops';    

// --- KHỞI ĐỘNG ỨNG DỤNG ---
window.onload = function() {
    initApp();
};

function initApp() {
    if (!localStorage.getItem('busmap_db')) {
        localStorage.setItem('busmap_db', JSON.stringify(busData));
    }
    db = JSON.parse(localStorage.getItem('busmap_db'));

    checkLoginStatus(); 

    document.getElementById('tabSearch').addEventListener('click', () => switchTab('search'));
    document.getElementById('tabRoute').addEventListener('click', () => switchTab('route'));
    document.getElementById('tabAdmin').addEventListener('click', () => switchTab('admin'));

    document.getElementById('searchInput').addEventListener('keyup', searchBus);
    document.getElementById('btnFindRoute').addEventListener('click', findRoute);
    document.getElementById('btnAddBus').addEventListener('click', adminAddBus);

    setupAutocomplete('startPoint', 'startSuggestions', false);
    setupAutocomplete('endPoint', 'endSuggestions', true);

    renderBusList(db, 'Danh sách các tuyến xe buýt');
    
    // ==================================================
    // BƯỚC 4 ĐÃ ĐƯỢC CHÈN VÀO ĐÂY: GỌI LỊCH SỬ TÌM KIẾM
    // ==================================================
    renderRouteHistory();
}

// --- ĐIỀU HƯỚNG TAB ---
function switchTab(tabType) {
    const tabs = ['Search', 'Route', 'Admin'];
    
    tabs.forEach(t => {
        document.getElementById(`tab${t}`)?.classList.remove('active');
        document.getElementById(`${t.toLowerCase()}Form`)?.classList.remove('active-form');
    });

    document.getElementById(`tab${tabType.charAt(0).toUpperCase() + tabType.slice(1)}`).classList.add('active');
    document.getElementById(`${tabType}Form`).classList.add('active-form');

    const mainContent = document.getElementById('mainContent');
    if (tabType === 'search' || tabType === 'admin') {
        renderBusList(db, 'Danh sách các tuyến xe buýt (Kho dữ liệu)'); 
    } else if (tabType === 'route') {
        mainContent.innerHTML = `
            <div class="empty-state">
                <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" alt="Bus Illustration">
                <h2>🗺️ Trải nghiệm tìm đường thông minh</h2>
                <p>Vui lòng nhập <b>Điểm xuất phát</b> và <b>Điểm kết thúc</b> ở cột bên trái để hệ thống tính toán và gợi ý lộ trình tốt nhất cho bạn.</p>
            </div>
        `;
    }
}