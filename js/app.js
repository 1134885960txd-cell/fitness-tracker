/* 健身打卡应用逻辑 */

const STORAGE_KEY = 'fitnessTrackerRecords_v1';

const EXERCISE_TYPES = [
  { key: 'strength', label: '力量训练' },
  { key: 'cardio', label: '有氧训练' },
  { key: 'stretch', label: '拉伸放松' },
  { key: 'walk', label: '户外步行/跑步' },
  { key: 'other', label: '其他运动' }
];

const MEALS = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' }
];

const BODY_DETAIL_FIELDS = [
  { key: 'bmi', label: 'BMI', unit: '', type: 'number', step: '0.1' },
  { key: 'subcutaneousFatRate', label: '皮下脂肪率', unit: '%', type: 'number', step: '0.1' },
  { key: 'visceralFatLevel', label: '内脏脂肪等级', unit: '级', type: 'number', step: '1' },
  { key: 'obesity', label: '肥胖度', unit: '%', type: 'number', step: '0.1' },
  { key: 'muscleRate', label: '肌肉率', unit: '%', type: 'number', step: '0.1' },
  { key: 'muscleMass', label: '肌肉量', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'skeletalMuscleRate', label: '骨骼肌率', unit: '%', type: 'number', step: '0.1' },
  { key: 'skeletalMuscleMass', label: '骨骼肌量', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'proteinMass', label: '蛋白质', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'proteinRate', label: '蛋白质占比', unit: '%', type: 'number', step: '0.1' },
  { key: 'bodyWaterMass', label: '体水分', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'bodyWaterRate', label: '体水分占比', unit: '%', type: 'number', step: '0.1' },
  { key: 'fatMass', label: '脂肪量', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'boneMass', label: '骨量', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'boneRate', label: '骨量占比', unit: '%', type: 'number', step: '0.1' },
  { key: 'fatFreeWeight', label: '去脂体重', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'subcutaneousFatMass', label: '皮下脂肪量', unit: 'kg', type: 'number', step: '0.1' },
  { key: 'bmr', label: '基础代谢', unit: 'kcal', type: 'number', step: '1' },
  { key: 'fatBurningHeartRate', label: '燃脂心率', unit: '次/分钟', type: 'text' },
  { key: 'bodyAge', label: '体年龄', unit: '岁', type: 'number', step: '1' },
  { key: 'fattyLiverRisk', label: '脂肪肝风险等级', unit: '', type: 'text' },
  { key: 'bodyType', label: '体型评估', unit: '', type: 'text' },
  { key: 'healthScore', label: '健康评分', unit: '分', type: 'number', step: '1' }
];

function getDefaultBodyDetail() {
  return Object.fromEntries(BODY_DETAIL_FIELDS.map(f => [f.key, '']));
}

/* ---------- 工具函数 ---------- */

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function loadAllRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAllRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getDefaultRecord(date) {
  return {
    date,
    weight: '',
    bodyFat: '',
    water: 0,
    bodyDetail: getDefaultBodyDetail(),
    exercise: {
      strength: false,
      cardio: false,
      stretch: false,
      walk: false,
      other: false,
      note: ''
    },
    diet: {
      breakfast: '',
      lunch: '',
      dinner: '',
      snack: ''
    }
  };
}

function loadRecord(date) {
  const all = loadAllRecords();
  const saved = all[date];
  const base = getDefaultRecord(date);
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    exercise: { ...base.exercise, ...saved.exercise },
    diet: { ...base.diet, ...saved.diet },
    bodyDetail: { ...base.bodyDetail, ...(saved.bodyDetail || {}) }
  };
}

function saveRecord(record) {
  const all = loadAllRecords();
  // 如果没有有效内容则删除该日期，保持存储干净
  if (isEmptyRecord(record)) {
    delete all[record.date];
  } else {
    all[record.date] = record;
  }
  saveAllRecords(all);
}

function isEmptyRecord(record) {
  if (record.weight || record.bodyFat || record.water) return false;
  if (EXERCISE_TYPES.some(t => record.exercise[t.key])) return false;
  if (record.exercise.note.trim()) return false;
  if (MEALS.some(m => record.diet[m.key].trim())) return false;
  if (BODY_DETAIL_FIELDS.some(f => String(record.bodyDetail[f.key] || '').trim())) return false;
  return true;
}

function completionScore(record) {
  let done = 0;
  const total = 2 + 1 + EXERCISE_TYPES.length + MEALS.length;
  if (record.weight) done += 1;
  if (record.bodyFat) done += 1;
  if (record.water > 0) done += 1;
  EXERCISE_TYPES.forEach(t => { if (record.exercise[t.key]) done += 1; });
  MEALS.forEach(m => { if (record.diet[m.key].trim()) done += 1; });
  return done / total;
}

function exerciseCount(record) {
  return EXERCISE_TYPES.filter(t => record.exercise[t.key]).length;
}

function dietCount(record) {
  return MEALS.filter(m => record.diet[m.key].trim()).length;
}

function showToast(message = '已保存') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ---------- DOM 元素 ---------- */

const views = {
  dashboard: document.getElementById('view-dashboard'),
  today: document.getElementById('view-today'),
  calendar: document.getElementById('view-calendar')
};

const navBtns = document.querySelectorAll('.nav-btn');
const goTodayBtn = document.getElementById('goTodayBtn');
const backFromToday = document.getElementById('backFromToday');
const rangeBtns = document.querySelectorAll('.range-btn');

const recordDateInput = document.getElementById('recordDate');
const inputWeight = document.getElementById('inputWeight');
const inputBodyFat = document.getElementById('inputBodyFat');
const inputWater = document.getElementById('inputWater');
const inputExerciseNote = document.getElementById('inputExerciseNote');
const exerciseOptions = document.getElementById('exerciseOptions');
const dietInputs = document.getElementById('dietInputs');
const saveBtn = document.getElementById('saveBtn');
const toggleDetailsBtn = document.getElementById('toggleDetailsBtn');
const bodyDetails = document.getElementById('bodyDetails');

const calendarGrid = document.getElementById('calendarGrid');
const calendarMonth = document.getElementById('calendarMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const backFromCalendar = document.getElementById('backFromCalendar');

let currentView = 'dashboard';
let currentRange = 7;
let calendarMonthDate = new Date();
let trendChart = null;

/* ---------- 视图切换 ---------- */

function switchView(viewName, options = {}) {
  currentView = viewName;
  Object.values(views).forEach(el => el.classList.add('hidden'));
  views[viewName].classList.remove('hidden');

  navBtns.forEach(btn => {
    const active = btn.dataset.view === viewName;
    btn.classList.toggle('text-emerald-600', active);
    btn.classList.toggle('text-slate-400', !active);
    btn.classList.toggle('hover:text-slate-600', !active);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();

  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'today') renderToday(options.date);
  if (viewName === 'calendar') renderCalendar();
}

/* ---------- 趋势首页 ---------- */

function renderDashboard() {
  const today = formatLocalDate(new Date());
  const record = loadRecord(today);

  document.getElementById('todayDate').textContent = `${today} 今日`;
  document.getElementById('dashWeight').textContent = record.weight ? `${record.weight} kg` : '--';
  document.getElementById('dashBodyFat').textContent = record.bodyFat ? `${record.bodyFat}%` : '--';
  document.getElementById('dashWater').textContent = record.water ? `${record.water} ml` : '--';
  document.getElementById('dashExercise').textContent = `${exerciseCount(record)}/${EXERCISE_TYPES.length}`;

  const meals = MEALS.filter(m => record.diet[m.key].trim());
  const dietSummary = document.getElementById('dietSummary');
  if (meals.length === 0) {
    dietSummary.innerHTML = '<span class="text-slate-400">今天还没有记录饮食</span>';
  } else {
    const list = meals.map(m => `<span class="inline-block bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md mr-2 mb-1">${m.label}: ${record.diet[m.key]}</span>`).join('');
    dietSummary.innerHTML = `<div class="font-medium text-slate-700 mb-1">已记录 ${meals.length} 餐</div>${list}`;
  }

  renderTrendChart();
}

function renderTrendChart() {
  const all = loadAllRecords();
  const dates = Object.keys(all).sort();
  let labels = [];
  let weights = [];
  let bodyFats = [];

  const cutoff = new Date();
  if (currentRange !== 'all') {
    cutoff.setDate(cutoff.getDate() - currentRange);
  }

  dates.forEach(date => {
    if (currentRange !== 'all' && parseLocalDate(date) < cutoff) return;
    const r = all[date];
    labels.push(date.slice(5)); // 显示 MM-DD
    weights.push(r.weight ? Number(r.weight) : null);
    bodyFats.push(r.bodyFat ? Number(r.bodyFat) : null);
  });

  const empty = labels.length === 0;
  document.getElementById('chartEmpty').classList.toggle('hidden', !empty);

  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }
  if (empty) return;

  const ctx = document.getElementById('trendChart').getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '体重 (kg)',
          data: weights,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.3,
          pointRadius: 3,
          yAxisID: 'y'
        },
        {
          label: '体脂率 (%)',
          data: bodyFats,
          borderColor: '#0ea5e9',
          backgroundColor: '#0ea5e9',
          tension: 0.3,
          pointRadius: 3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: '#f1f5f9' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

/* ---------- 今日打卡 ---------- */

function initForm() {
  exerciseOptions.innerHTML = EXERCISE_TYPES.map(t => `
    <label class="check-card">
      <input type="checkbox" data-exercise="${t.key}" />
      <span class="text-sm">${t.label}</span>
    </label>
  `).join('');

  dietInputs.innerHTML = MEALS.map(m => `
    <label class="block">
      <span class="text-xs text-slate-500">${m.label}</span>
      <input type="text" data-meal="${m.key}" class="mt-1 w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none" placeholder="吃了什么？" />
    </label>
  `).join('');

  bodyDetails.innerHTML = BODY_DETAIL_FIELDS.map(f => `
    <label class="block">
      <span class="text-xs text-slate-500">${f.label}${f.unit ? ` (${f.unit})` : ''}</span>
      <input type="${f.type}" ${f.type === 'number' ? `step="${f.step}"` : ''} data-body-detail="${f.key}" class="mt-1 w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none" placeholder="${f.type === 'number' ? '0' : ''}" />
    </label>
  `).join('');
}

function renderToday(date) {
  const target = date || formatLocalDate(new Date());
  recordDateInput.value = target;
  const record = loadRecord(target);

  inputWeight.value = record.weight;
  inputBodyFat.value = record.bodyFat;
  inputWater.value = record.water || '';
  inputExerciseNote.value = record.exercise.note;

  document.querySelectorAll('[data-exercise]').forEach(cb => {
    cb.checked = !!record.exercise[cb.dataset.exercise];
  });

  document.querySelectorAll('[data-meal]').forEach(input => {
    input.value = record.diet[input.dataset.meal] || '';
  });

  BODY_DETAIL_FIELDS.forEach(f => {
    const input = document.querySelector(`[data-body-detail="${f.key}"]`);
    if (input) input.value = record.bodyDetail[f.key] || '';
  });
}

function gatherRecord() {
  const date = recordDateInput.value || formatLocalDate(new Date());
  const exercise = { note: inputExerciseNote.value.trim() };
  EXERCISE_TYPES.forEach(t => {
    const cb = document.querySelector(`[data-exercise="${t.key}"]`);
    exercise[t.key] = cb ? cb.checked : false;
  });
  const diet = {};
  MEALS.forEach(m => {
    const input = document.querySelector(`[data-meal="${m.key}"]`);
    diet[m.key] = input ? input.value.trim() : '';
  });
  const bodyDetail = {};
  BODY_DETAIL_FIELDS.forEach(f => {
    const input = document.querySelector(`[data-body-detail="${f.key}"]`);
    bodyDetail[f.key] = input ? input.value.trim() : '';
  });
  return {
    date,
    weight: inputWeight.value,
    bodyFat: inputBodyFat.value,
    water: Number(inputWater.value) || 0,
    exercise,
    diet,
    bodyDetail
  };
}

function handleSave() {
  const record = gatherRecord();
  saveRecord(record);
  showToast('记录已保存');
  // 保存后返回趋势页，体验更顺畅
  switchView('dashboard');
}

/* ---------- 日历 ---------- */

function renderCalendar() {
  const y = calendarMonthDate.getFullYear();
  const m = calendarMonthDate.getMonth();
  calendarMonth.textContent = `${y}年${m + 1}月`;

  const startOfMonth = new Date(y, m, 1);
  const offset = (startOfMonth.getDay() + 6) % 7; // 周一开始
  const startDate = new Date(y, m, 1 - offset);
  const todayStr = formatLocalDate(new Date());
  const all = loadAllRecords();

  let html = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = formatLocalDate(d);
    const inMonth = d.getMonth() === m;
    const record = all[dateStr];
    const score = record ? completionScore(record) : 0;
    const colorClass = completionColorClass(score);
    const isToday = dateStr === todayStr;

    html += `
      <div class="calendar-day ${inMonth ? '' : 'other-month'} ${isToday ? 'today-ring' : ''} ${colorClass}"
           data-date="${dateStr}">
        <span>${d.getDate()}</span>
        ${record ? `<span class="text-[10px] mt-0.5 opacity-80">${Math.round(score * 100)}%</span>` : ''}
      </div>
    `;
  }
  calendarGrid.innerHTML = html;

  calendarGrid.querySelectorAll('.calendar-day').forEach(cell => {
    cell.addEventListener('click', () => {
      switchView('today', { date: cell.dataset.date });
    });
  });
}

function completionColorClass(score) {
  if (score === 0) return 'bg-slate-100 text-slate-400';
  if (score < 0.3) return 'bg-emerald-50 text-emerald-800';
  if (score < 0.55) return 'bg-emerald-100 text-emerald-800';
  if (score < 0.8) return 'bg-emerald-200 text-emerald-900';
  return 'bg-emerald-300 text-emerald-900';
}

const SEED_DATE = '2026-07-09';
const SEED_BODY_DETAIL = {
  bmi: '23.4',
  subcutaneousFatRate: '14.8',
  visceralFatLevel: '8',
  obesity: '7.6',
  muscleRate: '74.8',
  muscleMass: '53.6',
  skeletalMuscleRate: '40.5',
  skeletalMuscleMass: '29.0',
  proteinMass: '14.4',
  proteinRate: '20.1',
  bodyWaterMass: '39.2',
  bodyWaterRate: '54.7',
  fatMass: '14.8',
  boneMass: '3.3',
  boneRate: '4.6',
  fatFreeWeight: '56.9',
  subcutaneousFatMass: '10.6',
  bmr: '1600',
  fatBurningHeartRate: '113-151',
  bodyAge: '31',
  fattyLiverRisk: '低',
  bodyType: '偏胖型',
  healthScore: '98'
};

function seedReportData() {
  const record = loadRecord(SEED_DATE);
  if (!record.weight && !record.bodyFat) {
    record.weight = '71.70';
    record.bodyFat = '20.6';
    record.bodyDetail = { ...SEED_BODY_DETAIL };
    saveRecord(record);
  }
}

/* ---------- 事件绑定 ---------- */

document.addEventListener('DOMContentLoaded', () => {
  initForm();
  seedReportData();

  toggleDetailsBtn.addEventListener('click', () => {
    bodyDetails.classList.toggle('hidden');
    const hidden = bodyDetails.classList.contains('hidden');
    toggleDetailsBtn.querySelector('span').textContent = hidden ? '展开详细身体数据' : '收起详细身体数据';
    const icon = toggleDetailsBtn.querySelector('i');
    icon.setAttribute('data-lucide', hidden ? 'chevron-down' : 'chevron-up');
    lucide.createIcons();
  });

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  goTodayBtn.addEventListener('click', () => switchView('today'));
  backFromToday.addEventListener('click', () => switchView('dashboard'));

  rangeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range === 'all' ? 'all' : Number(btn.dataset.range);
      rangeBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('bg-white', active);
        b.classList.toggle('text-slate-900', active);
        b.classList.toggle('shadow-sm', active);
        b.classList.toggle('text-slate-500', !active);
      });
      renderTrendChart();
    });
  });

  document.querySelectorAll('.water-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      const add = Number(btn.dataset.add);
      inputWater.value = (Number(inputWater.value) || 0) + add;
    });
  });

  saveBtn.addEventListener('click', handleSave);

  recordDateInput.addEventListener('change', () => {
    renderToday(recordDateInput.value);
  });

  prevMonthBtn.addEventListener('click', () => {
    calendarMonthDate.setMonth(calendarMonthDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    calendarMonthDate.setMonth(calendarMonthDate.getMonth() + 1);
    renderCalendar();
  });

  backFromCalendar.addEventListener('click', () => {
    switchView('today', { date: formatLocalDate(new Date()) });
  });

  switchView('dashboard');
});
