// --- State Management ---
let state = {
    is24Hour: localStorage.getItem('is24Hour') === 'true',
    isAnalog: localStorage.getItem('isAnalog') === 'true',
    theme: localStorage.getItem('theme') || 'default',
    activeTab: 'clock',
    worldClocks: JSON.parse(localStorage.getItem('worldClocks')) || [
        { city: 'London', zone: 'Europe/London' },
        { city: 'New York', zone: 'America/New_York' },
        { city: 'Tokyo', zone: 'Asia/Tokyo' }
    ],
    alarms: JSON.parse(localStorage.getItem('alarms')) || [],
    stopwatch: {
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,
        laps: []
    },
    timer: {
        timeLeft: 0,
        interval: null,
        isRunning: false
    }
};

// --- DOM Elements ---
const timeEl = document.getElementById('live-time');
const dateEl = document.getElementById('current-date');
const amPmEl = document.getElementById('am-pm');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    renderWorldClocks();
    renderAlarms();
    applyTheme(state.theme);
    fetchWeather();
    setInterval(fetchWeather, 300000); // Update every 5 mins
    
    if (state.isAnalog) toggleAnalogUI(true);

    // Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'a') switchTab('alarm');
        if (e.key === 'c') switchTab('clock');
        if (e.key === 's') switchTab('stopwatch');
        if (e.key === 't') switchTab('timer');
        if (e.key === 'f') toggleFullscreen();
    });
    
    if ('Notification' in window) {
        Notification.requestPermission();
    }
});

// --- Tab Switching ---
function switchTab(tabId) {
    // Update State
    state.activeTab = tabId;

    // Update Sidebar UI (Desktop)
    document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('active-tab'));
    const desktopTab = document.getElementById(`tab-${tabId}`);
    if (desktopTab) desktopTab.classList.add('active-tab');

    // Update Mobile Nav UI
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
        btn.classList.remove('active-tab-mobile', 'text-white');
        btn.classList.add('text-white/60');
    });
    const mobileTab = document.getElementById(`m-tab-${tabId}`);
    if (mobileTab) {
        mobileTab.classList.add('active-tab-mobile', 'text-white');
        mobileTab.classList.remove('text-white/60');
    }

    // Update Views
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) targetView.classList.remove('hidden');
}


// --- Digital Clock ---
function updateTime() {
    const now = new Date();
    
    // Date
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    dateEl.innerText = now.toLocaleDateString(undefined, options);

    // Time
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    if (!state.is24Hour) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        amPmEl.innerText = ampm;
        timeEl.innerText = `${hours}:${minutes}:${seconds}`;
    } else {
        amPmEl.innerText = '';
        timeEl.innerText = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    }

    // --- Analog Clock Hands ---
    const secondsRatio = now.getSeconds() / 60;
    const minutesRatio = (secondsRatio + now.getMinutes()) / 60;
    const hoursRatio = (minutesRatio + now.getHours()) / 12;

    setRotation('hour-hand', hoursRatio);
    setRotation('min-hand', minutesRatio);
    setRotation('sec-hand', secondsRatio);

    checkAlarms(now);
}

function setRotation(id, rotationRatio) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.setProperty('transform', `rotate(${rotationRatio * 360}deg)`);
}

function toggleAnalog() {
    state.isAnalog = !state.isAnalog;
    saveState();
    toggleAnalogUI(state.isAnalog);
}

function toggleAnalogUI(isAnalog) {
    const digital = document.getElementById('digital-clock');
    const analog = document.getElementById('analog-clock');
    if (isAnalog) {
        digital.classList.add('hidden');
        analog.classList.remove('hidden');
    } else {
        digital.classList.remove('hidden');
        analog.classList.add('hidden');
    }
}

// --- World Clock ---
function renderWorldClocks() {
    const container = document.getElementById('world-clock-list');
    if (!container) return;
    
    container.innerHTML = state.worldClocks.map((wc, index) => {
        const timeStr = new Date().toLocaleTimeString('en-US', { 
            timeZone: wc.zone, 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: !state.is24Hour 
        });
        
        return `
            <div class="macos-glass p-6 rounded-3xl flex justify-between items-center group relative overflow-hidden">
                <div>
                    <p class="text-sm opacity-50 uppercase tracking-widest">${wc.city}</p>
                    <p class="text-2xl font-bold">${timeStr}</p>
                </div>
                <button onclick="removeWorldClock(${index})" class="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/40 hover:text-red-400">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function removeWorldClock(index) {
    state.worldClocks.splice(index, 1);
    saveState();
    renderWorldClocks();
}

// --- Alarm System ---
function openAlarmModal() {
    document.getElementById('alarm-modal').classList.remove('hidden');
    document.getElementById('alarm-modal').classList.add('flex');
}

function closeAlarmModal() {
    document.getElementById('alarm-modal').classList.add('hidden');
    document.getElementById('alarm-modal').classList.remove('flex');
}

function saveAlarm() {
    const time = document.getElementById('new-alarm-time').value;
    const label = document.getElementById('new-alarm-label').value || 'Alarm';
    const repeat = document.getElementById('new-alarm-repeat').checked;

    if (!time) return showToast('Please select a time', 'error');

    state.alarms.push({
        id: Date.now(),
        time: time,
        label: label,
        repeat: repeat,
        enabled: true
    });

    saveState();
    renderAlarms();
    closeAlarmModal();
    showToast('Alarm set for ' + time);
}

function renderAlarms() {
    const container = document.getElementById('alarm-list');
    if (!container) return;

    container.innerHTML = state.alarms.map((alarm, index) => `
        <div class="macos-glass p-6 rounded-3xl flex flex-col justify-between">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <p class="text-4xl font-bold">${alarm.time}</p>
                    <p class="text-white/60 font-medium">${alarm.label}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" ${alarm.enabled ? 'checked' : ''} onchange="toggleAlarm(${alarm.id})" class="sr-only">
                    <div class="toggle-bg w-11 h-6 bg-white/20 rounded-full"></div>
                    <div class="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                </label>
            </div>
            <div class="flex justify-between items-center text-xs opacity-50">
                <span>${alarm.repeat ? 'Every Day' : 'Once'}</span>
                <button onclick="deleteAlarm(${alarm.id})" class="hover:text-red-400"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function toggleAlarm(id) {
    const alarm = state.alarms.find(a => a.id === id);
    if (alarm) {
        alarm.enabled = !alarm.enabled;
        saveState();
    }
}

function deleteAlarm(id) {
    state.alarms = state.alarms.filter(a => a.id !== id);
    saveState();
    renderAlarms();
}

function checkAlarms(now) {
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const seconds = now.getSeconds();

    if (seconds === 0) { // Check only at the start of a minute
        state.alarms.forEach(alarm => {
            if (alarm.enabled && alarm.time === currentTimeStr) {
                triggerAlarm(alarm);
            }
        });
    }
}

function triggerAlarm(alarm) {
    showToast(`ALARM: ${alarm.label}`, 'alarm');
    playNotificationSound();
    
    // Vibration support
    if ('vibrate' in navigator) {
        navigator.vibrate([500, 110, 500, 110, 450, 110]);
    }

    if (Notification.permission === 'granted') {
        new Notification('Alarm', { body: alarm.label, icon: 'https://cdn-icons-png.flaticon.com/512/2784/2784459.png' });
    }
}

// --- Stopwatch Logic ---
function toggleStopwatch() {
    const startBtn = document.getElementById('stopwatch-start-btn');
    const lapBtn = document.getElementById('lap-btn');

    if (!state.stopwatch.timerInterval) {
        state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;
        state.stopwatch.timerInterval = setInterval(updateStopwatch, 10);
        startBtn.innerText = 'Stop';
        startBtn.classList.replace('bg-green-500/20', 'bg-red-500/20');
        startBtn.classList.replace('text-green-400', 'text-red-400');
        lapBtn.disabled = false;
    } else {
        clearInterval(state.stopwatch.timerInterval);
        state.stopwatch.timerInterval = null;
        startBtn.innerText = 'Start';
        startBtn.classList.replace('bg-red-500/20', 'bg-green-500/20');
        startBtn.classList.replace('text-red-400', 'text-green-400');
    }
}

function updateStopwatch() {
    state.stopwatch.elapsedTime = Date.now() - state.stopwatch.startTime;
    document.getElementById('stopwatch-display').innerText = formatTimeMs(state.stopwatch.elapsedTime);
}

function resetStopwatch() {
    clearInterval(state.stopwatch.timerInterval);
    state.stopwatch.timerInterval = null;
    state.stopwatch.elapsedTime = 0;
    state.stopwatch.laps = [];
    document.getElementById('stopwatch-display').innerText = '00:00.00';
    document.getElementById('stopwatch-start-btn').innerText = 'Start';
    document.getElementById('laps-list').innerHTML = '';
    document.getElementById('lap-btn').disabled = true;
}

function addLap() {
    const lapTime = state.stopwatch.elapsedTime;
    state.stopwatch.laps.unshift(lapTime);
    renderLaps();
}

function renderLaps() {
    const container = document.getElementById('laps-list');
    container.innerHTML = state.stopwatch.laps.map((lap, index) => `
        <div class="lap-item flex justify-between p-4 px-6 items-center">
            <span class="opacity-40">Lap ${state.stopwatch.laps.length - index}</span>
            <span class="font-mono text-lg">${formatTimeMs(lap)}</span>
        </div>
    `).join('');
}

// --- Timer Logic ---
function startTimer() {
    const h = parseInt(document.getElementById('timer-hours').value) || 0;
    const m = parseInt(document.getElementById('timer-minutes').value) || 0;
    const s = parseInt(document.getElementById('timer-seconds').value) || 0;

    const totalSeconds = (h * 3600) + (m * 60) + s;
    if (totalSeconds <= 0) return showToast('Set a valid time', 'error');

    state.timer.timeLeft = totalSeconds;
    state.timer.isRunning = true;

    document.querySelector('.timer-setup').classList.add('hidden');
    document.getElementById('timer-running').classList.remove('hidden');

    updateTimerDisplay();
    state.timer.interval = setInterval(() => {
        state.timer.timeLeft--;
        updateTimerDisplay();
        if (state.timer.timeLeft <= 0) {
            clearInterval(state.timer.interval);
            timerFinished();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const h = Math.floor(state.timer.timeLeft / 3600);
    const m = Math.floor((state.timer.timeLeft % 3600) / 60);
    const s = state.timer.timeLeft % 60;
    document.getElementById('timer-display').innerText = 
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function cancelTimer() {
    clearInterval(state.timer.interval);
    state.timer.isRunning = false;
    document.querySelector('.timer-setup').classList.remove('hidden');
    document.getElementById('timer-running').classList.add('hidden');
}

function timerFinished() {
    playNotificationSound();
    showToast('Timer Finished!', 'success');
    
    if ('vibrate' in navigator) {
        navigator.vibrate([1000, 500, 1000]);
    }

    if (Notification.permission === 'granted') {
        new Notification('Timer Finished!', { body: 'Your countdown has ended.' });
    }
    cancelTimer();
}

// --- Utilities ---
function formatTimeMs(ms) {
    const date = new Date(ms);
    const m = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    const msStr = String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0');
    return `${m}:${s}.${msStr}`;
}

function toggleSettings() {
    const themes = ['default', 'ocean', 'sunset', 'forest'];
    let idx = themes.indexOf(state.theme);
    state.theme = themes[(idx + 1) % themes.length];
    
    saveState();
    applyTheme(state.theme);
    showToast(`Theme switched to ${state.theme}`);
}

function applyTheme(theme) {
    const bg = document.body;
    const themeGradients = {
        default: 'linear-gradient(-45deg, #1e3a8a, #4c1d95, #831843, #1e40af)',
        ocean: 'linear-gradient(-45deg, #0f172a, #0369a1, #0891b2, #0e7490)',
        sunset: 'linear-gradient(-45deg, #7c2d12, #991b1b, #7f1d1d, #450a0a)',
        forest: 'linear-gradient(-45deg, #064e3b, #14532d, #166534, #065f46)'
    };
    
    bg.style.background = themeGradients[theme] || themeGradients.default;
    bg.style.backgroundSize = '400% 400%';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showToast('Entering Fullscreen');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

async function fetchWeather() {
    try {
        const res = await fetch('https://wttr.in/?format=3');
        const data = await res.text();
        const weatherEl = document.getElementById('weather-widget');
        if (weatherEl) weatherEl.innerText = data;
    } catch (e) {
        console.log("Weather failed", e);
    }
}

function saveState() {
    localStorage.setItem('worldClocks', JSON.stringify(state.worldClocks));
    localStorage.setItem('alarms', JSON.stringify(state.alarms));
    localStorage.setItem('is24Hour', state.is24Hour);
    localStorage.setItem('isAnalog', state.isAnalog);
    localStorage.setItem('theme', state.theme);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg animate-fade-in p-4 px-6 rounded-2xl flex items-center space-x-3 text-sm font-medium mt-3';
    
    let icon = 'fa-info-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'alarm') icon = 'fa-bell';
    if (type === 'success') icon = 'fa-check-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.replace('animate-fade-in', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1016/1016-preview.mp3');
    audio.play();
}
