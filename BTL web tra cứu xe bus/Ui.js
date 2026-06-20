// =====================================
// ui.js (Xử lý giao diện & Hiển thị)
// =====================================

function renderBusList(dataArray, title) {
    const mainContent = document.getElementById('mainContent');
    let html = `<h2 class="section-title">${title}</h2>`;

    if (dataArray.length === 0) {
        html += `<p style="color:#e74c3c; font-weight:bold; margin-top: 10px;">Không tìm thấy kết quả phù hợp (Không có đường đi liên thông).</p>`;
    } else {
        for (let i = 0; i < dataArray.length; i++) {
            const item = dataArray[i];

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
            } else {
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

function handleCardClick(busId) {
    const bus = db.find(b => b.id === busId);
    if (bus) showBusDetail(bus);
}

function showBusDetail(bus) {
    currentBusInfo = bus;
    currentDirection = 'out';
    currentView = 'stops';

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="detail-header-new">
            <button class="btn-back-icon" id="btnBackToSearch">⬅</button>
            <h2 class="section-title" style="margin-bottom:0;">Tuyến số ${bus.id}</h2>
        </div>
        <div class="route-tabs-container">
            <button id="btnDirOut" class="route-tab-new active">Xem lượt đi</button>
            <button id="btnDirIn" class="route-tab-new">Xem lượt về</button>
        </div>
        <div class="view-tabs-container">
            <button id="btnViewStops" class="view-tab active">Trạm dừng</button>
            <button id="btnViewTime" class="view-tab">Biểu đồ giờ</button>
        </div>
        <div id="contentStops">
            <ul class="stop-list-new" id="detailStopList"></ul>
        </div>
        <div id="contentTime" style="display: none;">
            <div class="time-header">
                <span class="th-btn">⬅</span><span class="th-title">HÔM NAY</span><span class="th-btn">➡</span>
            </div>
            <div class="time-grid" id="detailTimeGrid"></div>
        </div>
    `;
    
    document.getElementById('btnBackToSearch').addEventListener('click', () => document.getElementById('tabSearch').click());
    document.getElementById('btnDirOut').addEventListener('click', () => updateDetailView('out', currentView));
    document.getElementById('btnDirIn').addEventListener('click', () => updateDetailView('in', currentView));
    document.getElementById('btnViewStops').addEventListener('click', () => updateDetailView(currentDirection, 'stops'));
    document.getElementById('btnViewTime').addEventListener('click', () => updateDetailView(currentDirection, 'time'));

    updateDetailView('out', 'stops');
}

function updateDetailView(direction, viewMode) {
    currentDirection = direction;
    currentView = viewMode;

    document.getElementById('btnDirOut').className = direction === 'out' ? 'route-tab-new active' : 'route-tab-new';
    document.getElementById('btnDirIn').className = direction === 'in' ? 'route-tab-new active' : 'route-tab-new';
    document.getElementById('btnViewStops').className = viewMode === 'stops' ? 'view-tab active' : 'view-tab';
    document.getElementById('btnViewTime').className = viewMode === 'time' ? 'view-tab active' : 'view-tab';

    document.getElementById('contentStops').style.display = viewMode === 'stops' ? 'block' : 'none';
    document.getElementById('contentTime').style.display = viewMode === 'time' ? 'block' : 'none';

    if (viewMode === 'stops') {
        const stopsArray = direction === 'out' ? currentBusInfo.outbound : currentBusInfo.inbound;
        const ul = document.getElementById('detailStopList');
        ul.innerHTML = ''; 
        stopsArray.forEach(stop => {
            let li = document.createElement('li');
            li.textContent = stop;
            ul.appendChild(li); 
        });
    } else {
        renderTimetable(currentBusInfo.time);
    }
}

function renderTimetable(timeString) {
    const grid = document.getElementById('detailTimeGrid');
    grid.innerHTML = '';
    try {
        let parts = timeString.split('-');
        let [startH, startM] = parts[0].trim().split(':').map(Number);
        let [endH, endM] = parts[1].trim().split(':').map(Number);

        let currentMins = startH * 60 + startM;
        let endMins = endH * 60 + endM;
        let interval = 15; 

        let now = new Date();
        let sysMins = now.getHours() * 60 + now.getMinutes();
        let hasHighlighted = false;

        while (currentMins <= endMins) {
            let h = Math.floor(currentMins / 60);
            let m = currentMins % 60;
            let timeLabel = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            
            let div = document.createElement('div');
            div.className = 'time-cell';
            div.textContent = timeLabel;

            if (currentMins < sysMins) div.classList.add('past');
            else if (!hasHighlighted) { div.classList.add('active'); hasHighlighted = true; }

            grid.appendChild(div);
            currentMins += interval;
        }
    } catch (e) {
        grid.innerHTML = '<p style="text-align:center; color:red;">Dữ liệu giờ không hợp lệ!</p>';
    }
}