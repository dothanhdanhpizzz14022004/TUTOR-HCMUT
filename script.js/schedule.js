const pages = document.querySelectorAll('.page-view');
const btnTutor = document.getElementById('btn-tutor');
const btnStudent = document.getElementById('btn-student');
const headerSubtitle = document.getElementById('header-subtitle');
const roleButtonsContainer = document.getElementById('role-buttons-container'); 

// Lấy thông tin người dùng từ localStorage (Lấy từ code demo/login.html)
// Giả định rằng userRole là 'student' hoặc 'tutor' sau khi đăng nhập
const isLoggedIn = localStorage.getItem('hcmut_logged_in') === 'true';
const userRole = localStorage.getItem('hcmut_role') || 'guest';
const username = localStorage.getItem('hcmut_username') || '';

// Khởi tạo Modal Bootstrap
const addTimeSlotModal = new bootstrap.Modal(document.getElementById('addTimeSlotModal'));
const confirmConsultationModal = new bootstrap.Modal(document.getElementById('confirmConsultationModal'));
const cancelConsultationModal = new bootstrap.Modal(document.getElementById('cancelConsultationModal'));
const cancelStudentBookingModal = new bootstrap.Modal(document.getElementById('cancelStudentBookingModal'));
const confirmStudentBookingModal = new bootstrap.Modal(document.getElementById('confirmStudentBookingModal'));

// --- Dữ liệu Mẫu (Mô phỏng Database) ---
let nextConsultationId = 6; 
let nextSlotId = 3;
let currentSelectedDate = '27/10/2025'; // Giả lập ngày đang chọn trên lịch

// Dữ liệu Tutor
let tutorConsultations = [
    { id: 1, student: 'Trần Thị B', subject: 'Tiếng Anh', date: '26/10/2025', time: '14:00 - 15:00', status: 'confirmed' },
    { id: 2, student: 'Nguyễn Văn A', subject: 'Toán học', date: '27/10/2025', time: '09:00 - 10:00', status: 'pending' },
    { id: 3, student: 'Lê Văn C', subject: 'Vật lý', date: '26/10/2025', time: '10:00 - 11:00', status: 'completed' },
];

let tutorAvailabilitySlots = [
    { id: 1, time: '16:00 - 17:00', date: '27/10/2025' }, 
    { id: 2, time: '14:00 - 15:00', date: '27/10/2025' }
];

// Dữ liệu Sinh viên
let studentUpcomingConsultations = [
    { id: 4, subject: 'Toán học', date: '27/10/2025', time: '09:00 - 10:00', status: 'pending' },
    { id: 5, subject: 'Tiếng Anh', date: '28/10/2025', time: '14:00 - 15:00', status: 'confirmed' }
];
let studentHistoryConsultations = [
    { id: 3, subject: 'Vật lý', date: '26/10/2025', time: '10:00 - 11:00', status: 'completed' } 
];

// ---Helper Functions---
const getStatusDisplay = (status) => {
    switch(status) {
        case 'pending': return 'Chờ xác nhận';
        case 'confirmed': return 'Đã xác nhận';
        case 'completed': return 'Hoàn thành';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
};

function isValidTimeComponent(value, type) {
    if (!value) return false;
    const num = parseInt(value, 10);
    if (isNaN(num)) return false;

    if (type === 'hour') {
        return num >= 0 && num <= 23;
    } else if (type === 'minute') {
        return num >= 0 && num <= 59;
    }
    return false;
}

const padTwoDigits = (num) => String(num).padStart(2, '0');

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function isOverlap(newStart, newEnd, existingSlotTime) {
    const [existStartStr, existEndStr] = existingSlotTime.split(' - ');
    
    const newStartMin = timeToMinutes(newStart);
    const newEndMin = timeToMinutes(newEnd);
    const existStartMin = timeToMinutes(existStartStr);
    const existEndMin = timeToMinutes(existEndStr);

    return (newStartMin < existEndMin && newEndMin > existStartMin);
}

function setupTimeInputs() {
    const hourInputs = document.querySelectorAll('.time-hour');
    const minuteInputs = document.querySelectorAll('.time-minute');

    hourInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 2);
            if (e.target.value.length === 2) {
                const minuteInput = e.target.nextElementSibling.nextElementSibling;
                if (minuteInput) minuteInput.focus();
            }
        });
        
        input.addEventListener('blur', (e) => {
            if (e.target.value.length === 1) {
                e.target.value = padTwoDigits(e.target.value);
            }
        });
    });

    minuteInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 2);
        });
        
        input.addEventListener('blur', (e) => {
            if (e.target.value.length === 1) {
                e.target.value = padTwoDigits(e.target.value);
            }
        });
    });
}


// ---Render Functions---

function renderTutorConsultations() {
    const container = document.getElementById('tutor-consultations-container');
    if (!container) return;

    const sortedConsultations = tutorConsultations.sort((a, b) => {
        const order = { pending: 1, confirmed: 2, completed: 3, cancelled: 4 };
        return order[a.status] - order[b.status];
    });

    const html = sortedConsultations.map(c => {
        let actionButtons;
        
        if (c.status === 'pending') {
            actionButtons = `
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary btn-action-sm" onclick="confirmConsultation(${c.id})">
                        <i class="fas fa-check me-1"></i> Xác nhận
                    </button>
                    <button class="btn btn-sm btn-outline-danger-custom btn-action-sm" onclick="cancelTutorConsultation(${c.id})">
                        <i class="fas fa-times me-1"></i> Hủy
                    </button>
                </div>`;
        } else if (c.status === 'confirmed') {
             actionButtons = `
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-danger-custom btn-action-sm" onclick="cancelTutorConsultation(${c.id})">
                        <i class="fas fa-times me-1"></i> Hủy
                    </button>
                </div>`;
        } else {
            const text = c.status === 'completed' ? 'Buổi học đã hoàn thành' : 'Buổi học đã bị hủy';
            const badgeClass = c.status === 'completed' ? 'bg-light text-success' : 'bg-light text-danger';
            actionButtons = `
                <div class="mt-2">
                    <span class="badge ${badgeClass} p-2">${text}</span>
                </div>`;
        }

        return `
            <div class="consultation-item" data-id="${c.id}">
                <div class="consultation-details">
                    <h6>${c.student}</h6>
                    <small>${c.subject}</small>
                    <div class="consultation-meta small text-muted">
                        <i class="far fa-calendar-alt"></i> ${c.date}
                        <i class="far fa-clock ms-3"></i> ${c.time}
                    </div>
                    ${actionButtons}
                </div>
                <div class="consultation-status">
                    <span class="status-badge status-${c.status}">${getStatusDisplay(c.status)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html || '<p class="text-center text-muted mt-3">Không có buổi tư vấn nào.</p>';
}

function renderTutorAvailability() {
    const container = document.getElementById('tutor-availability-slots-container');
    const dateDisplay = document.querySelector('#tutor-availability h6 .small');
    if (!container) return;
    
    if (dateDisplay) {
        dateDisplay.textContent = currentSelectedDate;
    }

    const filteredSlots = tutorAvailabilitySlots.filter(slot => slot.date === currentSelectedDate);
    
    const sortedSlots = filteredSlots.sort((a, b) => a.time.localeCompare(b.time));

    const html = sortedSlots.map(slot => `
        <div class="time-slot-item" data-slot-id="${slot.id}">
            <span>${slot.time}</span>
            <button onclick="deleteTimeSlot(${slot.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');

    container.innerHTML = html || '<p class="text-center text-muted mt-3">Chưa có khung giờ rảnh nào được thêm.</p>';
}


function renderStudentView() {
    const availableContainer = document.getElementById('student-available-slots-container');
    if(availableContainer) {
        const dateDisplay = document.querySelector('#student-booking .col-md-7 .card:nth-child(1) .small');
        if (dateDisplay) dateDisplay.textContent = currentSelectedDate;

        const filteredSlots = tutorAvailabilitySlots.filter(slot => slot.date === currentSelectedDate);
        const sortedSlots = filteredSlots.sort((a, b) => a.time.localeCompare(b.time));
        
        const slotsHtml = sortedSlots.map(slot => `
            <div class="time-slot-item border-bottom-0" data-slot-id="${slot.id}">
                <span>${slot.time}</span>
                <button class="btn btn-primary btn-sm btn-book" onclick="bookTimeSlot(${slot.id}, '${slot.time}', '${slot.date}')">Đặt lịch</button>
            </div>
        `).join('');
        availableContainer.innerHTML = slotsHtml;
    }

    const upcomingContainer = document.getElementById('student-upcoming-consultations-container');
    if (upcomingContainer) {
        const upcomingHtml = studentUpcomingConsultations.map(c => `
            <div class="consultation-item d-block" data-consultation-id="${c.id}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${c.subject}</h6>
                    <span class="status-${c.status} small">${getStatusDisplay(c.status)}</span>
                </div>
                <div class="consultation-meta small text-muted mb-3">
                    <i class="far fa-calendar-alt"></i> ${c.date}
                    <i class="far fa-clock ms-3"></i> ${c.time}
                </div>
                <button class="btn-danger-lg-custom btn-cancel" onclick="cancelStudentConsultation(${c.id})">
                    <i class="fas fa-times me-1"></i> Hủy buổi học
                </button>
            </div>
        `).join('');
        upcomingContainer.innerHTML = upcomingHtml || '<p class="text-center text-muted mt-3">Bạn chưa có buổi học nào sắp tới.</p>';
    }

    const historyContainer = document.getElementById('student-history-container');
    if (historyContainer) {
        const historyHtml = studentHistoryConsultations.map(c => `
            <div class="consultation-item">
                <div class="consultation-details">
                    <h6>${c.subject}</h6>
                    <div class="consultation-meta small text-muted">
                        <i class="far fa-calendar-alt"></i> ${c.date}
                        <i class="far fa-clock ms-3"></i> ${c.time}
                    </div>
                </div>
                <div class="consultation-status">
                    <span class="status-badge status-${c.status}">${getStatusDisplay(c.status)}</span>
                </div>
            </div>
        `).join('');
        historyContainer.innerHTML = historyHtml || '<p class="text-center text-muted mt-3">Không có lịch sử.</p>';
    }
}


// ---Interaction Functions---

let currentBookingSlot = { id: null, time: null, date: null };

window.bookTimeSlot = function(slotId, time, date) {
    if (userRole !== 'student' && userRole !== 'admin') {
        alert("Chỉ Sinh viên mới có thể đặt lịch.");
        return;
    }
    
    const [newStart, newEnd] = time.split(' - ');

    const isStudentOverlap = studentUpcomingConsultations.some(c => {
        if (c.date === date) {
            return isOverlap(newStart, newEnd, c.time);
        }
        return false;
    });

    if (isStudentOverlap) {
        alert("Khung giờ này bị chồng chéo với một buổi học sắp tới của bạn. Vui lòng chọn giờ khác!");
        return;
    }

    currentBookingSlot = { id: slotId, time: time, date: date };
    document.getElementById('confirmStudentBookingTime').textContent = time;
    confirmStudentBookingModal.show();
}

document.getElementById('finalConfirmStudentBookingBtn').onclick = function() {
    const { id: slotId, time, date } = currentBookingSlot;

    const bookedSlot = tutorAvailabilitySlots.find(slot => slot.id === slotId);
    if (!bookedSlot) {
        confirmStudentBookingModal.hide();
        return;
    }

    tutorAvailabilitySlots = tutorAvailabilitySlots.filter(slot => slot.id !== slotId);
    
    const newConsultationId = nextConsultationId++;
    const newConsultation = { 
        id: newConsultationId, 
        subject: 'Toán học (Demo)',
        date: date, 
        time: time, 
        status: 'pending' 
    };
    studentUpcomingConsultations.push(newConsultation);

    tutorConsultations.push({
        ...newConsultation,
        student: 'Sinh viên (Demo)',
        subject: newConsultation.subject
    });

    confirmStudentBookingModal.hide();
    renderStudentView();
};

let currentConsultationId = null;

window.cancelStudentConsultation = function(consultationId) {
    const consultation = studentUpcomingConsultations.find(c => c.id === consultationId);
    if (!consultation) return;

    currentConsultationId = consultationId;
    document.getElementById('cancelStudentBookingSubject').textContent = consultation.subject;

    cancelStudentBookingModal.show();
}

document.getElementById('finalCancelStudentBookingBtn').onclick = function() {
    const consultationId = currentConsultationId;
    
    const index = studentUpcomingConsultations.findIndex(c => c.id === consultationId);
    if (index > -1) {
        const cancelled = studentUpcomingConsultations.splice(index, 1)[0];
        
        studentHistoryConsultations.push({ ...cancelled, status: 'cancelled' });

        tutorAvailabilitySlots.push({ id: nextSlotId++, time: cancelled.time, date: cancelled.date });
        tutorAvailabilitySlots.sort((a, b) => a.time.localeCompare(b.time));

        const tutorIndex = tutorConsultations.findIndex(c => c.id === consultationId);
        if (tutorIndex > -1) {
             tutorConsultations.splice(tutorIndex, 1);
        }

        renderStudentView();
    }
    cancelStudentBookingModal.hide();
};


window.confirmConsultation = function(consultationId) {
    if (userRole !== 'tutor' && userRole !== 'admin') {
        alert("Chỉ Tutor mới có thể xác nhận lịch.");
        return;
    }
    
    const consultation = tutorConsultations.find(c => c.id === consultationId);
    if (!consultation) return;

    currentConsultationId = consultationId;
    document.getElementById('confirmConsultationStudentName').textContent = consultation.student;
    
    confirmConsultationModal.show();
}

document.getElementById('finalConfirmConsultationBtn').onclick = function() {
    const consultationId = currentConsultationId;
    
    const tutorIndex = tutorConsultations.findIndex(c => c.id === consultationId);
    const studentIndex = studentUpcomingConsultations.findIndex(c => c.id === consultationId);
    
    if (tutorIndex > -1) {
        tutorConsultations[tutorIndex].status = 'confirmed';
        
        if (studentIndex > -1) {
            studentUpcomingConsultations[studentIndex].status = 'confirmed';
        }

        renderTutorConsultations();
    }
    confirmConsultationModal.hide();
};


window.cancelTutorConsultation = function(consultationId) {
    if (userRole !== 'tutor' && userRole !== 'admin') {
        alert("Chỉ Tutor mới có thể hủy lịch.");
        return;
    }
    
    const consultation = tutorConsultations.find(c => c.id === consultationId);
    if (!consultation) return;

    currentConsultationId = consultationId;
    document.getElementById('cancelConsultationStudentName').textContent = consultation.student;
    
    cancelConsultationModal.show();
}

document.getElementById('finalCancelConsultationBtn').onclick = function() {
    const consultationId = currentConsultationId;
    
    const index = tutorConsultations.findIndex(c => c.id === consultationId);
    if (index > -1) {
        const cancelled = tutorConsultations[index];
        
        cancelled.status = 'cancelled'; 

        const studentIndex = studentUpcomingConsultations.findIndex(c => c.id === consultationId);
        if (studentIndex > -1) {
            const studentCancelled = studentUpcomingConsultations.splice(studentIndex, 1)[0];
            studentHistoryConsultations.push({ ...studentCancelled, status: 'cancelled' });
        }
        
        tutorAvailabilitySlots.push({ id: nextSlotId++, time: cancelled.time, date: cancelled.date });
        tutorAvailabilitySlots.sort((a, b) => a.time.localeCompare(b.time));

        renderTutorConsultations();
        renderStudentView(); 
    }
    cancelConsultationModal.hide();
};


window.addTimeSlot = function() {
    if (userRole !== 'tutor' && userRole !== 'admin') {
        alert("Chỉ Tutor mới có thể thêm khung giờ rảnh.");
        return;
    }
    
    document.getElementById('modal-subtitle').textContent = `Thêm khung giờ rảnh cho ngày ${currentSelectedDate}`;
    
    const startTimeHour = document.getElementById('startTimeHour');
    const startTimeMinute = document.getElementById('startTimeMinute');
    const endTimeHour = document.getElementById('endTimeHour');
    const endTimeMinute = document.getElementById('endTimeMinute');

    startTimeHour.value = '09';
    startTimeMinute.value = '00';
    endTimeHour.value = '10';
    endTimeMinute.value = '00';
    
    [startTimeHour, startTimeMinute, endTimeHour, endTimeMinute].forEach(input => input.classList.remove('is-invalid'));
    
    addTimeSlotModal.show();
}

window.handleAddTimeSlot = function() {
    if (userRole !== 'tutor' && userRole !== 'admin') { return; }
    
    const startTimeHour = document.getElementById('startTimeHour');
    const startTimeMinute = document.getElementById('startTimeMinute');
    const endTimeHour = document.getElementById('endTimeHour');
    const endTimeMinute = document.getElementById('endTimeMinute');
    
    const inputs = [
        { el: startTimeHour, type: 'hour' },
        { el: startTimeMinute, type: 'minute' },
        { el: endTimeHour, type: 'hour' },
        { el: endTimeMinute, type: 'minute' },
    ];
    
    let isValid = true;
    
    inputs.forEach(({ el, type }) => {
        el.classList.remove('is-invalid');
        const value = el.value;

        if (value.length !== 2 || !isValidTimeComponent(value, type)) {
            el.classList.add('is-invalid');
            isValid = false;
        }
    });

    if (!isValid) {
        return;
    }
    
    const startTime = `${startTimeHour.value}:${startTimeMinute.value}`;
    const endTime = `${endTimeHour.value}:${endTimeMinute.value}`;
    const timeSlot = `${startTime} - ${endTime}`;

    if (startTime >= endTime) {
        alert("Giờ kết thúc phải sau Giờ bắt đầu!");
        startTimeHour.classList.add('is-invalid');
        endTimeHour.classList.add('is-invalid');
        return;
    }
    
    const allUsedSlots = [
        ...tutorAvailabilitySlots.map(s => ({ time: s.time, date: s.date })),
        ...tutorConsultations.filter(c => c.status === 'confirmed').map(c => ({ time: c.time, date: c.date }))
    ];

    const isOverlapping = allUsedSlots.some(slot => {
        if (slot.date === currentSelectedDate) {
            return isOverlap(startTime, endTime, slot.time);
        }
        return false;
    });

    if (isOverlapping) {
        alert("Khung giờ bạn chọn bị chồng chéo với một lịch rảnh hoặc buổi tư vấn đã xác nhận khác!");
        startTimeHour.classList.add('is-invalid');
        endTimeHour.classList.add('is-invalid');
        return;
    }

    const newSlot = {
        id: nextSlotId++,
        time: timeSlot,
        date: currentSelectedDate
    };
    tutorAvailabilitySlots.push(newSlot);
    
    addTimeSlotModal.hide();
    renderTutorAvailability();
    renderStudentView(); 
}

window.deleteTimeSlot = function(slotId) {
    if (userRole !== 'tutor' && userRole !== 'admin') {
        alert("Chỉ Tutor mới có thể xóa khung giờ rảnh.");
        return;
    }
    if (!confirm("Bạn có muốn xóa khung giờ rảnh này không?")) return;
    
    tutorAvailabilitySlots = tutorAvailabilitySlots.filter(slot => slot.id !== slotId);
    renderTutorAvailability();
    renderStudentView(); 
}

function showPage(pageId) {
    pages.forEach(page => page.style.display = 'none');
    const pageElement = document.getElementById(pageId);
    if(pageElement) pageElement.style.display = 'block';
}

function setActiveRole(activeRole) {
    if (activeRole === 'tutor' && userRole !== 'tutor' && userRole !== 'admin') {
         alert("Truy cập bị từ chối: Chế độ Tutor chỉ dành cho Tutor/Admin.");
         return;
    }
    if (activeRole === 'student' && userRole !== 'student' && userRole !== 'admin') {
         alert("Truy cập bị từ chối: Chế độ Sinh viên chỉ dành cho Sinh viên/Admin.");
         return;
    }

    btnTutor.classList.remove('btn-outline-primary', 'btn-primary');
    btnStudent.classList.remove('btn-outline-primary', 'btn-primary');
    
    if (activeRole === 'tutor') {
        btnTutor.classList.add('btn-primary');
        btnStudent.classList.add('btn-outline-primary');
        headerSubtitle.textContent = 'Dành cho gia sư và tutor';
        showTutorConsultation();
    } else {
        btnTutor.classList.add('btn-outline-primary');
        btnStudent.classList.add('btn-primary');
        headerSubtitle.textContent = 'Đặt lịch học với tutor';
        showPage('student-booking');
        renderStudentView();
    }
}

function updateTutorTabs(activeId) {
    const tabSelectors = [
        document.querySelector('#tutor-consultation-list .nav-link:nth-child(1)'),
        document.querySelector('#tutor-consultation-list .nav-link:nth-child(2)'),
        document.querySelector('#tutor-availability .nav-link:nth-child(1)'),
        document.querySelector('#tutor-availability .nav-link:nth-child(2)')
    ].filter(Boolean);

    tabSelectors.forEach(tab => {
        tab.classList.remove('active', 'active-blue'); 
    });
    
    if (activeId === 'consultation') {
        tabSelectors.filter(t => t.textContent.includes('Buổi tư vấn')).forEach(t => t.classList.add('active', 'active-blue'));
    } else if (activeId === 'availability') {
        tabSelectors.filter(t => t.textContent.includes('Lịch rảnh')).forEach(t => t.classList.add('active', 'active-blue'));
    }
}

window.showTutorConsultation = function() {
    showPage('tutor-consultation-list');
    updateTutorTabs('consultation');
    renderTutorConsultations();
};

window.showTutorAvailability = function() {
    showPage('tutor-availability');
    updateTutorTabs('availability');
    renderTutorAvailability();
};
function initSchedulePage() {
    if (roleButtonsContainer && userRole !== 'admin') {
         if (userRole === 'tutor') {
            btnStudent.style.display = 'none'; 
         } else if (userRole === 'student') {
            btnTutor.style.display = 'none'; 
         }
    }

    if (btnTutor) btnTutor.addEventListener('click', () => setActiveRole('tutor'));
    if (btnStudent) btnStudent.addEventListener('click', () => setActiveRole('student'));
    setupTimeInputs(); 

    if (userRole === 'tutor' || userRole === 'admin') {
        setActiveRole('tutor');
    } else {
        setActiveRole('student');
    }
}

document.addEventListener('DOMContentLoaded', initSchedulePage);