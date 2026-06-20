// ==========================================
// FILE: main.js (Xử lý giao diện trang chủ - Bản Full)
// ==========================================

let db = []; // Database cục bộ
let isAdmin = false; // Phân quyền

window.onload = function() {
    initApp();
};

function initApp() {
    // Tích hợp LocalStorage làm Database
    if (!localStorage.getItem('busmap_db')) {
        // Nạp dữ liệu từ data.js vào Database nếu chạy lần đầu
        localStorage.setItem('busmap_db', JSON.stringify(busData));
    }
    // Lấy dữ liệu ra từ DB
    db = JSON.parse(localStorage.getItem('busmap_db'));

    checkLoginStatus(); 

    document.getElementById('tabSearch').addEventListener('click', () => switchTab('search'));
    document.getElementById('tabRoute').addEventListener('click', () => switchTab('route'));
    document.getElementById('tabAdmin').addEventListener('click', () => switchTab('admin'));

    document.getElementById('searchInput').addEventListener('keyup', searchBus);
    document.getElementById('btnFindRoute').addEventListener('click', findRoute);
    document.getElementById('btnAddBus').addEventListener('click', adminAddBus);

    // KÍCH HOẠT AUTOCOMPLETE (false = Điểm xuất phát, true = Điểm kết thúc)
    setupAutocomplete('startPoint', 'startSuggestions', false);
    setupAutocomplete('endPoint', 'endSuggestions', true);

    // Render danh sách ban đầu
    renderBusList(db, 'Danh sách các tuyến xe buýt');
}

function switchTab(tabType) {
    const tabs = ['Search', 'Route', 'Admin'];
    
    // Tắt tất cả tab và form
    tabs.forEach(t => {
        document.getElementById(`tab${t}`)?.classList.remove('active');
        document.getElementById(`${t.toLowerCase()}Form`)?.classList.remove('active-form');
    });

    // Bật Tab được chọn
    document.getElementById(`tab${tabType.charAt(0).toUpperCase() + tabType.slice(1)}`).classList.add('active');
    document.getElementById(`${tabType}Form`).classList.add('active-form');

    const mainContent = document.getElementById('mainContent');
    if (tabType === 'search' || tabType === 'admin') {
        renderBusList(db, 'Danh sách các tuyến xe buýt (Kho dữ liệu)'); 
    } else if (tabType === 'route') {
        mainContent.innerHTML = '<h2 class="section-title">🗺️ Vui lòng nhập điểm đi và điểm đến để tìm tuyến.</h2>';
    }
}

// ==========================================
// XỬ LÝ RENDER GIAO DIỆN & TÌM ĐƯỜNG
// ==========================================

function renderBusList(dataArray, title) {
    const mainContent = document.getElementById('mainContent');
    let html = `<h2 class="section-title">${title}</h2>`;

    if (dataArray.length === 0) {
        html += `<p style="color:#e74c3c; font-weight:bold; margin-top: 10px;">Không tìm thấy kết quả phù hợp (Không có đường đi liên thông).</p>`;
    } else {
        for (let i = 0; i < dataArray.length; i++) {
            const item = dataArray[i];

            // NẾU LÀ KẾT QUẢ "ĐI 2 CHUYẾN"
            if (item.isTransfer) {
                html += `
                    <div class="bus-card" style="border-left: 4px solid #e74c3c; cursor: default;">
                        <h4 class="bus-title" style="color: #d32f2f;">🔄 Lộ trình 2 chuyến (Trung chuyển)</h4>
                        <div style="line-height: 1.8; color: #334155; font-size: 15px;">
                            <span>🚶 <b>Bước 1:</b> Bắt <b style="color:#1c2e4a;">Tuyến số ${item.bus1.id}</b> đi đến trạm <span style="background:#fee2e2; padding:2px 8px; border-radius:4px; color:#d32f2f; font-weight:bold;">"${item.transferStop}"</span>.</span><br>
                            <span>🚌 <b>Bước 2:</b> Tại đây, đổi sang <b style="color:#1c2e4a;">Tuyến số ${item.bus2.id}</b> để đi tới đích.</span>
                        </div>
                    </div>
                `;
            } 
            // NẾU LÀ KẾT QUẢ "ĐI THẲNG" 
            else {
                const bus = item;
                let deleteBtnHtml = isAdmin ? `<button class="btn-delete" onclick="adminDeleteBus('${bus.id}', event)">Thùng Rác</button>` : '';

                html += `
                    <div class="bus-card" onclick="handleCardClick('${bus.id}')">
                        ${deleteBtnHtml}
                        <h4 class="bus-title">🚍︎ Tuyến số ${bus.id}: ${bus.name}</h4>
                        <div class="card-info">
                            <span class="info-badge">⏰︎ ${bus.time}</span>
                            <span class="info-badge">💰︎ ${bus.price}</span>
                        </div>
                    </div>
                `;
            }
        }
    }
    mainContent.innerHTML = html;
}

function searchBus() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = db.filter(bus => bus.id.toLowerCase().includes(keyword) || bus.name.toLowerCase().includes(keyword));
    renderBusList(filtered, 'Kết quả tìm kiếm');
}

function findRoute() {
    const start = document.getElementById('startPoint').value.toLowerCase().trim();
    const end = document.getElementById('endPoint').value.toLowerCase().trim();
    if (start === '' || end === '') { alert("Vui lòng nhập đầy đủ điểm đi và điểm đến!"); return; }

    let matchedDirect = [];   
    let matchedTransfer = []; 

    // Kiểm tra đi thẳng
    const checkDirect = (arr, startKw, endKw) => {
        let sIdxs = [], eIdxs = [];
        arr.forEach((s, idx) => {
            if (s.toLowerCase().includes(startKw)) sIdxs.push(idx);
            if (s.toLowerCase().includes(endKw)) eIdxs.push(idx);
        });
        for (let s of sIdxs) {
            for (let e of eIdxs) {
                if (s < e) return true;
            }
        }
        return false;
    };

    // Tìm tuyến đi thẳng
    for (let i = 0; i < db.length; i++) {
        let bus = db[i];
        if (checkDirect(bus.outbound, start, end) || checkDirect(bus.inbound, start, end)) {
            matchedDirect.push(bus);
        }
    }

    // Tìm tuyến trung chuyển (Nếu không có đi thẳng)
    if (matchedDirect.length === 0) {
        for (let i = 0; i < db.length; i++) {
            let bus1 = db[i];
            let reachable = []; 
            
            let outStartIdx = bus1.outbound.findIndex(s => s.toLowerCase().includes(start));
            if (outStartIdx !== -1) reachable.push(...bus1.outbound.slice(outStartIdx + 1));
            
            let inStartIdx = bus1.inbound.findIndex(s => s.toLowerCase().includes(start));
            if (inStartIdx !== -1) reachable.push(...bus1.inbound.slice(inStartIdx + 1));

            if (reachable.length === 0) continue;

            for (let j = 0; j < db.length; j++) {
                if (i === j) continue; 
                let bus2 = db[j];
                let pickup = []; 

                let outEndIdx = bus2.outbound.findIndex(s => s.toLowerCase().includes(end));
                if (outEndIdx !== -1) pickup.push(...bus2.outbound.slice(0, outEndIdx));
                
                let inEndIdx = bus2.inbound.findIndex(s => s.toLowerCase().includes(end));
                if (inEndIdx !== -1) pickup.push(...bus2.inbound.slice(0, inEndIdx));

                if (pickup.length === 0) continue;

                let transferStop = reachable.find(rStop => pickup.includes(rStop));
                if (transferStop) {
                    matchedTransfer.push({ isTransfer: true, bus1: bus1, bus2: bus2, transferStop: transferStop });
                    break; 
                }
            }
        }
        matchedTransfer = matchedTransfer.slice(0, 3); 
    }

    if (matchedDirect.length > 0) {
        renderBusList(matchedDirect, `📍 Đi thẳng từ "${start}" đến "${end}":`);
    } else if (matchedTransfer.length > 0) {
        renderBusList(matchedTransfer, `📍 Lộ trình gợi ý (Không có tuyến đi thẳng):`);
    } else {
        renderBusList([], `Gợi ý tuyến xe đi từ "${start}" đến "${end}":`);
    }
}

function handleCardClick(busId) {
    const bus = db.find(b => b.id === busId);
    if (bus) showBusDetail(bus);
}

function showBusDetail(bus) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="detail-header-new">
            <button class="btn-back-icon" id="btnBackToSearch">⬅</button>
            <h2 class="section-title" style="margin-bottom:0;">Tuyến số ${bus.id}</h2>
        </div>
        <div class="route-tabs-container">
            <button id="btnOut" class="route-tab-new active">Xem lượt đi</button>
            <button id="btnIn" class="route-tab-new">Xem lượt về</button>
        </div>
        <ul class="stop-list-new" id="detailStopList"></ul>
    `;
    
    document.getElementById('btnBackToSearch').addEventListener('click', () => document.getElementById('tabSearch').click());
    document.getElementById('btnOut').addEventListener('click', () => renderStops(bus.outbound, 'out'));
    document.getElementById('btnIn').addEventListener('click', () => renderStops(bus.inbound, 'in'));
    renderStops(bus.outbound, 'out');
}

function renderStops(stopsArray, direction) {
    document.getElementById('btnOut').className = direction === 'out' ? 'route-tab-new active' : 'route-tab-new';
    document.getElementById('btnIn').className = direction === 'in' ? 'route-tab-new active' : 'route-tab-new';
    const ul = document.getElementById('detailStopList');
    ul.innerHTML = ''; 
    for (let i = 0; i < stopsArray.length; i++) {
        let li = document.createElement('li');
        li.textContent = stopsArray[i];
        ul.appendChild(li); 
    }
}

// ==========================================
// XỬ LÝ PHÂN QUYỀN & CHỨC NĂNG ADMIN
// ==========================================

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

// ==========================================
// TÍNH NĂNG GỢI Ý TỪ KHÓA (DEPENDENT AUTOCOMPLETE)
// ==========================================

function getAllUniqueStops() {
    let allStops = [];
    db.forEach(bus => {
        allStops = allStops.concat(bus.outbound);
        allStops = allStops.concat(bus.inbound);
    });
    return [...new Set(allStops)]; 
}

function getReachableStops(startKw) {
    let reachable = [];
    db.forEach(bus => {
        let outIdx = bus.outbound.findIndex(s => s.toLowerCase().includes(startKw));
        if (outIdx !== -1) reachable.push(...bus.outbound.slice(outIdx + 1));
        
        let inIdx = bus.inbound.findIndex(s => s.toLowerCase().includes(startKw));
        if (inIdx !== -1) reachable.push(...bus.inbound.slice(inIdx + 1));
    });
    return [...new Set(reachable)]; 
}

function setupAutocomplete(inputId, listId, isEndPoint = false) {
    const input = document.getElementById(inputId);
    const suggestionList = document.getElementById(listId);

    const showSuggestions = function() {
        const query = input.value.toLowerCase().trim();
        suggestionList.innerHTML = ''; 

        let sourceStops = [];

        if (isEndPoint) {
            const startKw = document.getElementById('startPoint').value.toLowerCase().trim();
            if (startKw !== '') {
                const directStops = getReachableStops(startKw);
                sourceStops = directStops.length > 0 ? directStops : getAllUniqueStops();
            } else {
                sourceStops = getAllUniqueStops();
            }
        } else {
            sourceStops = getAllUniqueStops(); 
        }

        let matchedStops = [];
        
        if (query === '') {
            if (isEndPoint && document.getElementById('startPoint').value.trim() !== '') {
                matchedStops = sourceStops; 
            } else {
                suggestionList.style.display = 'none';
                return;
            }
        } else {
            matchedStops = sourceStops.filter(stop => stop.toLowerCase().includes(query));
            
            if (matchedStops.length === 0 && isEndPoint) {
                matchedStops = getAllUniqueStops().filter(stop => stop.toLowerCase().includes(query));
            }
        }

        if (matchedStops.length > 0) {
            suggestionList.style.display = 'block';
            matchedStops.slice(0, 8).forEach(stop => {
                const li = document.createElement('li');
                li.textContent = stop;
                
                li.addEventListener('click', function(e) {
                    e.stopPropagation(); 
                    input.value = stop;
                    suggestionList.style.display = 'none';
                });
                suggestionList.appendChild(li);
            });
        } else {
            suggestionList.style.display = 'none';
        }
    };

    input.addEventListener('input', showSuggestions);
    input.addEventListener('focus', showSuggestions);

    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            suggestionList.style.display = 'none';
        }
    });
}