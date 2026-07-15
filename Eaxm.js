const defaultStudents = [
    { id: "SETEC-001", name: "Chan Oudom", sClass: "MIS G12" },
    { id: "SETEC-002", name: "Keo Sophea", sClass: "MIS G12" },
    { id: "SETEC-003", name: "Seng Dara", sClass: "MIS G12" },
    { id: "SETEC-004", name: "Nguon Piseth", sClass: "CS G11" }
];

// State variables
let students = JSON.parse(localStorage.getItem('setec_students')) || defaultStudents;
let attendanceDb = JSON.parse(localStorage.getItem('setec_attendance')) || {};
let studentIdToDelete = null; 

const getTodayString = () => new Date().toISOString().split('T')[0];

// Initialize App on Page Load
window.addEventListener('DOMContentLoaded', () => {
    const dateObj = new Date();
    
    // បន្ថែមលក្ខខណ្ឌការពារកុំឱ្យគាំង ប្រសិនបើមិនទាន់មាន Element ទាំងនេះក្នុងទំព័រ Login/Register
    const dateTextEl = document.getElementById('current-date-text');
    if (dateTextEl) {
        dateTextEl.innerText = dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    
    const filterDateInput = document.getElementById('filter-date-input');
    if (filterDateInput) {
        filterDateInput.value = getTodayString();
    }

    if (!localStorage.getItem('setec_students')) {
        localStorage.setItem('setec_students', JSON.stringify(defaultStudents));
    }

    renderAll();
});

// =============================================
// TAB SWITCHING LOGIC (បានកែសម្រួលឱ្យដើរពេញលេញ)
// =============================================
function switchTab(tabId) {
    // ១. បិទ (Hide) ផ្ទាំង UI ទាំងអស់ រួមទាំងផ្ទាំង settings ផងដែរ
    const allTabs = ['tab-dashboard', 'tab-students', 'tab-attendance', 'tab-report', 'tab-settings'];
    allTabs.forEach(id => {
        const tabElement = document.getElementById(id);
        if (tabElement) {
            tabElement.classList.add('hidden');
        }
    });

    // ២. បើកបង្ហាញ (Show) ផ្ទាំងដែលយើងបានចុច سلیکត
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }

    // ៣. ដូរពណ៌ប៊ូតុងម៉ឺនុយចំហៀង (Sidebar Active/Inactive)
    const navIds = ['dashboard', 'students', 'attendance', 'report', 'settings'];
    navIds.forEach(id => {
        const navElement = document.getElementById(`nav-${id}`);
        if (navElement) {
            if (id === tabId) {
                navElement.className = "flex items-center gap-3 px-4 py-3 rounded-xl text-white bg-blue-600 font-semibold transition duration-200 glow-active-tab";
            } else {
                navElement.className = "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-50 font-medium transition duration-200";
            }
        }
    });

    // ៤. ប្តូរចំណងជើងធំខាងលើ (Header Title)
    const titleMap = {
        dashboard: 'Dashboard',
        students: 'Students Directory',
        attendance: 'Mark Daily Attendance',
        report: 'Monthly Records',
        settings: 'System Settings'
    };
    
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl && titleMap[tabId]) {
        pageTitleEl.innerText = titleMap[tabId];
    }

    renderAll();
}

// --- Core Rendering Engine ---
function renderAll() {
    // បន្ថែមលក្ខខណ្ឌ Check ការពារ Error ពេល Render
    if (document.getElementById('stat-total')) renderDashboardStats();
    if (document.getElementById('dashboard-student-names')) renderDashboardNames();
    if (document.getElementById('student-list-body')) renderStudentsTable();
    if (document.getElementById('attendance-list-body')) renderAttendanceList();
    if (document.getElementById('report-list-body')) renderReportTable();
}

// Render Dashboard Statistics
function renderDashboardStats() {
    const today = getTodayString();
    const todayRecords = attendanceDb[today] || {};

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    students.forEach(student => {
        const status = todayRecords[student.id];
        if (status === 'Present') presentCount++;
        else if (status === 'Absent') absentCount++;
        else if (status === 'Late') lateCount++;
        else if (status === 'Excused') excusedCount++;
    });

    const total = students.length;
    const attendedSum = presentCount + lateCount + excusedCount; 
    const attendanceRate = total > 0 ? Math.round((attendedSum / total) * 100) : 0;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-present').innerText = presentCount;
    document.getElementById('stat-absent').innerText = absentCount;
    document.getElementById('stat-late').innerText = lateCount;
    document.getElementById('stat-excused').innerText = excusedCount;
    
    document.getElementById('chart-rate-text').innerText = `${attendanceRate}%`;
}

// Render student name listings directly on the Dashboard
function renderDashboardNames() {
    const nameContainer = document.getElementById('dashboard-student-names');
    nameContainer.innerHTML = '';

    if (students.length === 0) {
        nameContainer.innerHTML = `
            <div class="text-xs text-slate-400 italic py-4 text-center">
                <i class="bi bi-info-circle"></i> No registered students found.
            </div>
        `;
        return;
    }

    students.forEach(student => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-slate-50 border border-slate-100 px-3.5 py-2.5 rounded-xl hover:border-blue-500/30 transition duration-150";
        item.innerHTML = `
            <div class="flex items-center gap-2.5">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span class="text-sm font-semibold text-slate-700 tracking-wide">${student.name}</span>
            </div>
            <span class="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-mono">${student.id}</span>
        `;
        nameContainer.appendChild(item);
    });
}

// Render Student Management Directory Table
function renderStudentsTable() {
    const tbody = document.getElementById('student-list-body');
    tbody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.className = "border-b border-slate-100 text-sm hover:bg-slate-50/50";
        row.innerHTML = `
            <td class="py-4 px-4 font-bold text-blue-600">${student.id}</td>
            <td class="py-4 px-4 font-medium text-slate-800">${student.name}</td>
            <td class="py-4 px-4"><span class="bg-slate-100 px-3 py-1 rounded-full text-xs border border-slate-200 text-slate-600">${student.sClass}</span></td>
            <td class="py-4 px-4 text-right">
                <button onclick="openDeleteModal('${student.id}', '${student.name}')" class="text-rose-500 hover:text-rose-600 font-semibold text-xs">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Handle Add Student Form Submit
const studentForm = document.getElementById('student-form');
if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('student-id');
        const nameInput = document.getElementById('student-name');
        const classInput = document.getElementById('student-class');

        const newId = idInput.value.trim().toUpperCase();

        if (students.some(s => s.id === newId)) {
            alert("Student ID already exists!");
            return;
        }

        students.push({
            id: newId,
            name: nameInput.value.trim(),
            sClass: classInput.value.trim()
        });

        localStorage.setItem('setec_students', JSON.stringify(students));
        idInput.value = '';
        nameInput.value = '';
        classInput.value = '';
        
        renderAll();
    });
}

// POP-UP CONFIRMATION MODAL FUNCTIONS
function openDeleteModal(id, name) {
    studentIdToDelete = id; 
    
    document.getElementById('modal-student-name').innerText = name;
    document.getElementById('modal-student-id').innerText = id;
    
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('hidden');
    
    document.getElementById('confirm-delete-btn').onclick = function() {
        executeDeleteStudent();
    };
}

// មុខងារបិទ Modal
const closeBtn = document.getElementById('close-delete-modal-btn');
if (closeBtn) {
    closeBtn.onclick = closeDeleteModal;
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('hidden');
    studentIdToDelete = null;
}

function executeDeleteStudent() {
    if (studentIdToDelete) {
        students = students.filter(s => s.id !== studentIdToDelete);
        localStorage.setItem('setec_students', JSON.stringify(students));
        closeDeleteModal();
        renderAll();
    }
}

// Render Attendance Sheet
function renderAttendanceList() {
    const tbody = document.getElementById('attendance-list-body');
    tbody.innerHTML = '';

    const today = getTodayString();
    const todayRecords = attendanceDb[today] || {};

    students.forEach(student => {
        const currentStatus = todayRecords[student.id] || 'Present';
        const row = document.createElement('tr');
        row.className = "border-b border-slate-100 text-sm";
        row.innerHTML = `
            <td class="py-4 px-4 font-bold text-slate-400">${student.id}</td>
            <td class="py-4 px-4 font-semibold text-slate-800">${student.name}</td>
            <td class="py-4 px-4"><span class="bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-500">${student.sClass}</span></td>
            <td class="py-4 px-4">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="toggleStatus('${student.id}', 'Present')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${currentStatus === 'Present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}">Present</button>
                    <button onclick="toggleStatus('${student.id}', 'Absent')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${currentStatus === 'Absent' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}">Absent</button>
                    <button onclick="toggleStatus('${student.id}', 'Late')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${currentStatus === 'Late' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}">Late</button>
                    <button onclick="toggleStatus('${student.id}', 'Excused')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${currentStatus === 'Excused' ? 'bg-purple-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}">Excused</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Change single student attendance status
function toggleStatus(studentId, status) {
    const today = getTodayString();
    if (!attendanceDb[today]) {
        attendanceDb[today] = {};
    }
    attendanceDb[today][studentId] = status;
    renderAttendanceList();
}

// Set all students status instantly 
function setBulkAttendance(status) {
    const today = getTodayString();
    if (!attendanceDb[today]) {
        attendanceDb[today] = {};
    }
    students.forEach(student => {
        attendanceDb[today][student.id] = status;
    });
    renderAttendanceList();
}

// Save attendance to LocalStorage
function saveAttendance() {
    const today = getTodayString();
    
    if (!attendanceDb[today]) {
        attendanceDb[today] = {};
    }
    students.forEach(student => {
        if (!attendanceDb[today][student.id]) {
            attendanceDb[today][student.id] = 'Present';
        }
    });

    localStorage.setItem('setec_attendance', JSON.stringify(attendanceDb));
    alert(`Saved successfully for today (${today})!`);
    renderAll();
}

// Render Report Table
function renderReportTable() {
    const tbody = document.getElementById('report-list-body');
    tbody.innerHTML = '';

    const filterInput = document.getElementById('filter-date-input');
    if (!filterInput) return;

    const selectedDate = filterInput.value;
    const records = attendanceDb[selectedDate] || {};

    const matchedStudents = students.filter(student => records[student.id]);

    if (matchedStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-sm text-slate-400 font-medium">No records saved for this selected date.</td>
            </tr>
        `;
        return;
    }

    matchedStudents.forEach(student => {
        const status = records[student.id];
        let badgeClass = "bg-emerald-50 text-emerald-600 border border-emerald-200";
        if (status === 'Absent') badgeClass = "bg-rose-50 text-rose-600 border border-rose-200";
        if (status === 'Late') badgeClass = "bg-amber-50 text-amber-600 border border-amber-200";
        if (status === 'Excused') badgeClass = "bg-purple-50 text-purple-600 border border-purple-200";

        const row = document.createElement('tr');
        row.className = "border-b border-slate-100 text-sm hover:bg-slate-50/50";
        row.innerHTML = `
            <td class="py-4 px-4 text-slate-500 font-medium">${selectedDate}</td>
            <td class="py-4 px-4 font-bold text-slate-700">${student.id}</td>
            <td class="py-4 px-4 font-semibold text-slate-800">${student.name}</td>
            <td class="py-4 px-4"><span class="bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-600">${student.sClass}</span></td>
            <td class="py-4 px-4"><span class="${badgeClass} px-3 py-1 rounded-full text-xs font-bold">${status}</span></td>
        `;
        tbody.appendChild(row);
    });
}