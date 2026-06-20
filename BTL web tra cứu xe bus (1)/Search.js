// ==========================================
// search.js (Thuật toán tìm kiếm & Lộ trình)
// ==========================================

function searchBus() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = db.filter(bus => bus.id.toLowerCase().includes(keyword) || bus.name.toLowerCase().includes(keyword));
    renderBusList(filtered, 'Kết quả tìm kiếm');
}

function findRoute() {
    const start = document.getElementById('startPoint').value.toLowerCase().trim();
    const end = document.getElementById('endPoint').value.toLowerCase().trim();
    if (start === '' || end === '') { alert("Vui lòng nhập đầy đủ điểm đi và điểm đến!"); return; }

    // Gọi hàm lưu lịch sử tìm kiếm
    const rawStart = document.getElementById('startPoint').value.trim();
    const rawEnd = document.getElementById('endPoint').value.trim();
    saveRouteHistory(rawStart, rawEnd);

    let matchedDirect = [];   
    let matchedTransfer = []; 

    const checkDirect = (arr, startKw, endKw) => {
        let sIdxs = [], eIdxs = [];
        arr.forEach((s, idx) => {
            if (s.toLowerCase().includes(startKw)) sIdxs.push(idx);
            if (s.toLowerCase().includes(endKw)) eIdxs.push(idx);
        });
        for (let s of sIdxs) {
            for (let e of eIdxs) { if (s < e) return true; }
        }
        return false;
    };

    for (let i = 0; i < db.length; i++) {
        let bus = db[i];
        if (checkDirect(bus.outbound, start, end) || checkDirect(bus.inbound, start, end)) {
            matchedDirect.push(bus);
        }
    }

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
        renderBusList(matchedDirect, ` Đi thẳng từ "${start}" đến "${end}":`);
    } else if (matchedTransfer.length > 0) {
        renderBusList(matchedTransfer, ` Lộ trình gợi ý (Không có tuyến đi thẳng):`);
    } else {
        renderBusList([], `Gợi ý tuyến xe đi từ "${start}" đến "${end}":`);
    }
}

// ==========================================
// TÍNH NĂNG GỢI Ý TỪ KHÓA (AUTOCOMPLETE)
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
            } else sourceStops = getAllUniqueStops();
        } else {
            sourceStops = getAllUniqueStops(); 
        }

        let matchedStops = [];
        if (query === '') {
            if (isEndPoint && document.getElementById('startPoint').value.trim() !== '') matchedStops = sourceStops; 
            else { suggestionList.style.display = 'none'; return; }
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
        } else suggestionList.style.display = 'none';
    };

    input.addEventListener('input', showSuggestions);
    input.addEventListener('focus', showSuggestions);
    document.addEventListener('click', function(e) {
        if (e.target !== input) suggestionList.style.display = 'none';
    });
}

// ==========================================
// TÍNH NĂNG LƯU & XÓA LỊCH SỬ TÌM KIẾM + YÊU THÍCH
// ==========================================

function saveRouteHistory(start, end) {
    let history = JSON.parse(localStorage.getItem('busmap_route_history')) || [];
    const newRoute = { start: start, end: end };
    
    // Lọc bỏ nếu đã có, để đẩy lên đầu
    history = history.filter(item => !(item.start === start && item.end === end));
    history.unshift(newRoute);
    
    // Chỉ giữ lại tối đa 5 lịch sử tìm kiếm gần nhất cho đỡ rối
    if (history.length > 5) history.pop();
    
    localStorage.setItem('busmap_route_history', JSON.stringify(history));
    renderRouteHistory();
}

// Bật/Tắt đánh dấu Yêu thích (Ngôi sao)
function toggleFavoriteRoute(start, end) {
    let favRoutes = JSON.parse(localStorage.getItem('busmap_fav_routes')) || [];
    const index = favRoutes.findIndex(item => item.start === start && item.end === end);

    if (index !== -1) {
        favRoutes.splice(index, 1); // Đã có rồi thì bỏ yêu thích
    } else {
        favRoutes.push({ start, end }); // Chưa có thì thêm vào yêu thích
    }

    localStorage.setItem('busmap_fav_routes', JSON.stringify(favRoutes));
    renderRouteHistory();
}

function removeSingleHistory(start, end) {
    // Xóa khỏi lịch sử thường
    let history = JSON.parse(localStorage.getItem('busmap_route_history')) || [];
    history = history.filter(item => !(item.start === start && item.end === end));
    localStorage.setItem('busmap_route_history', JSON.stringify(history));
    
    // Xóa luôn khỏi danh sách yêu thích nếu có
    let favRoutes = JSON.parse(localStorage.getItem('busmap_fav_routes')) || [];
    favRoutes = favRoutes.filter(item => !(item.start === start && item.end === end));
    localStorage.setItem('busmap_fav_routes', JSON.stringify(favRoutes));

    renderRouteHistory();
}

function renderRouteHistory() {
    const historyContainer = document.getElementById('historyContainer');
    const historyList = document.getElementById('historyList');
    if (!historyContainer || !historyList) return;

    let history = JSON.parse(localStorage.getItem('busmap_route_history')) || [];
    let favRoutes = JSON.parse(localStorage.getItem('busmap_fav_routes')) || [];
    
    // Gộp danh sách: Ghim các tuyến có Ngôi sao lên đầu, rồi mới nối lịch sử thường vào
    let combinedList = [...favRoutes];
    history.forEach(h => {
        // Nếu lịch sử thường chưa có trong danh sách Yêu thích thì mới đưa vào
        if (!favRoutes.some(f => f.start === h.start && f.end === h.end)) {
            combinedList.push(h);
        }
    });

    if (combinedList.length === 0) {
        historyContainer.style.display = 'none';
        return;
    }

    historyContainer.style.display = 'block';
    historyList.innerHTML = '';
    
    combinedList.forEach(item => {
        // Kiểm tra xem mục này có đang được thả sao không
        const isFav = favRoutes.some(f => f.start === item.start && f.end === item.end);

        let li = document.createElement('li');
        
        // NẾU CÓ SAO (isFav = true): Ẩn đi nút × bằng cách thêm 'visibility: hidden; pointer-events: none;'
        li.innerHTML = `
            <div class="history-content" style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;">
                <span style="color:#ef4444; font-size:16px;"></span> 
                <div><b>${item.start}</b> ➔ <b>${item.end}</b></div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="fav-route-btn" title="${isFav ? 'Bỏ yêu thích' : 'Lưu tuyến yêu thích'}" style="font-size:22px; cursor:pointer; color: ${isFav ? '#f59e0b' : '#cbd5e1'}; transition: 0.2s; line-height: 1;">
                    ${isFav ? '★' : '☆'}
                </div>
                <div class="delete-history-item" title="Xóa vĩnh viễn mục này" style="${isFav ? 'visibility: hidden; pointer-events: none;' : ''}">×</div>
            </div>
        `;
        
        // Hiệu ứng phình to mượt mà khi di chuột vào Ngôi sao
        const starBtn = li.querySelector('.fav-route-btn');
        starBtn.addEventListener('mouseenter', () => starBtn.style.transform = 'scale(1.2)');
        starBtn.addEventListener('mouseleave', () => starBtn.style.transform = 'scale(1)');

        // Sự kiện 1: Bấm vào chữ thì tự động Điền & Tìm đường
        li.querySelector('.history-content').addEventListener('click', () => {
            document.getElementById('startPoint').value = item.start;
            document.getElementById('endPoint').value = item.end;
            findRoute(); 
        });

        // Sự kiện 2: Bấm vào Ngôi Sao 
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleFavoriteRoute(item.start, item.end);
        });

        // Sự kiện 3: Bấm vào dấu × (nếu đang được ghim sao thì sẽ không thể bấm được nữa)
        li.querySelector('.delete-history-item').addEventListener('click', (e) => {
            e.stopPropagation(); 
            if (!isFav) {
                removeSingleHistory(item.start, item.end);
            }
        });

        historyList.appendChild(li);
    });

    // Sự kiện 4: Bấm chữ "Xóa" màu đỏ ở trên cùng
    document.getElementById('clearHistoryBtn').onclick = function() {
        // Chỉ xóa lịch sử tạm thời, KHÔNG XÓA CÁC TUYẾN ĐƯỢC GẮN SAO!
        localStorage.removeItem('busmap_route_history');
        renderRouteHistory();
    };
}