const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const registerScreen = document.getElementById('register-screen');
const authMessage = document.getElementById('authMessage');
const registerMessage = document.getElementById('registerMessage');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerConfirm = document.getElementById('registerConfirm');
const loginTypeLabel = document.getElementById('loginTypeLabel');
const monthSelect = document.getElementById('monthSelect');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const totalBalanceEl = document.getElementById('totalBalance');
const recordForm = document.getElementById('recordForm');
const recordIdInput = document.getElementById('recordId');
const recordDate = document.getElementById('recordDate');
const recordType = document.getElementById('recordType');
const recordPerson = document.getElementById('recordPerson');
const recordAmount = document.getElementById('recordAmount');
const recordCategory = document.getElementById('recordCategory');
const recordNotes = document.getElementById('recordNotes');
const recordList = document.getElementById('recordList');
const monthsSummary = document.getElementById('monthsSummary');
const monthMessage = document.getElementById('monthMessage');
const statementTitle = document.getElementById('statementTitle');
const recordCount = document.getElementById('recordCount');
const resetFormBtn = document.getElementById('resetFormBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const formCard = document.getElementById('formCard');
const formNotice = document.getElementById('formNotice');
const loginTypeFields = document.getElementsByName('loginType');
const registerTypeFields = document.getElementsByName('registerType');

const storageKey = 'monthlyTrackerData';
const usersKey = 'monthlyTrackerUsers';
const loginKey = 'monthlyTrackerLogin';
const currentYear = new Date().getFullYear();

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function init() {
  const today = new Date();
  recordDate.value = today.toISOString().slice(0, 10);
  populateMonthSelect();
  monthSelect.value = String(today.getMonth() + 1);
  loadLoginState();
  loadData();
  addListeners();
}

function addListeners() {
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  showRegisterBtn.addEventListener('click', showRegisterScreen);
  showLoginBtn.addEventListener('click', showLoginScreen);
  logoutBtn.addEventListener('click', handleLogout);
  monthSelect.addEventListener('change', renderSelectedMonth);
  recordForm.addEventListener('submit', handleRecordSave);
  resetFormBtn.addEventListener('click', resetForm);
  downloadPdfBtn.addEventListener('click', downloadPdf);
}

function loadLoginState() {
  const loginState = JSON.parse(localStorage.getItem(loginKey) || 'null');
  if (loginState && loginState.loggedIn) {
    showDashboard(loginState.type, loginState.username);
  } else {
    showLoginScreen();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  const loginType = [...loginTypeFields].find((field) => field.checked).value;
  const users = getUsers();
  const passwordHash = await hashPassword(password);
  const user = users.find((u) => u.username === username && u.passwordHash === passwordHash && u.type === loginType);
  if (!user) {
    authMessage.textContent = 'Invalid username, password, or login type. Please try again.';
    authMessage.classList.add('error');
    return;
  }
  const state = { loggedIn: true, type: user.type, username: user.username, timestamp: new Date().toISOString() };
  localStorage.setItem(loginKey, JSON.stringify(state));
  authMessage.textContent = `Welcome ${user.username}.`;
  authMessage.classList.remove('error');
  showDashboard(user.type, user.username);
}

function showDashboard(type, username) {
  loginScreen.classList.remove('active');
  registerScreen.classList.remove('active');
  dashboardScreen.classList.add('active');
  loginTypeLabel.textContent = type === 'me' ? `Logged in as: ${username}` : 'Logged in as: Parent';
  if (type === 'parent') {
    alert('Parent login successful. You can view only your child\'s records.');
    formCard.style.display = 'none';
    formNotice.textContent = 'Parents cannot add or edit records here.';
  } else {
    formCard.style.display = 'block';
    formNotice.textContent = 'Add or edit borrowed/lent money records here.';
  }
  renderSelectedMonth();
}

function handleLogout() {
  localStorage.removeItem(loginKey);
  dashboardScreen.classList.remove('active');
  loginScreen.classList.add('active');
  registerScreen.classList.remove('active');
  loginForm.reset();
  registerForm.reset();
  authMessage.textContent = 'Please login with username and password.';
  authMessage.classList.remove('error');
}

function showLoginScreen() {
  loginScreen.classList.add('active');
  registerScreen.classList.remove('active');
  dashboardScreen.classList.remove('active');
  authMessage.textContent = 'Please login with username and password.';
  authMessage.classList.remove('error');
}

function showRegisterScreen() {
  loginScreen.classList.remove('active');
  registerScreen.classList.add('active');
  dashboardScreen.classList.remove('active');
  registerMessage.textContent = 'Create a secure account.';
  registerMessage.classList.remove('error');
}

async function handleRegister(event) {
  event.preventDefault();
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const confirm = registerConfirm.value;
  const loginType = [...registerTypeFields].find((field) => field.checked).value;
  const users = getUsers();
  if (users.some((user) => user.username === username)) {
    registerMessage.textContent = 'Username already exists. Choose a different one.';
    registerMessage.classList.add('error');
    return;
  }
  if (password !== confirm) {
    registerMessage.textContent = 'Passwords do not match. Please try again.';
    registerMessage.classList.add('error');
    return;
  }
  const passwordHash = await hashPassword(password);
  users.push({ username, passwordHash, type: loginType });
  localStorage.setItem(usersKey, JSON.stringify(users));
  registerMessage.textContent = 'Registration successful. Please login now.';
  registerMessage.classList.remove('error');
  showLoginScreen();
}

function getSavedData() {
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
}

function getUsers() {
  return JSON.parse(localStorage.getItem(usersKey) || '[]');
}

function getCurrentLogin() {
  return JSON.parse(localStorage.getItem(loginKey) || 'null');
}

function getCurrentUser() {
  const login = getCurrentLogin();
  if (!login) return null;
  return getUsers().find((user) => user.username === login.username) || null;
}

function getOwnedRecords(records) {
  const login = getCurrentLogin();
  if (!login) return [];
  if (login.type === 'parent') {
    const childUsernames = getUsers().filter((user) => user.type === 'me').map((user) => user.username);
    return records.filter((record) => childUsernames.includes(record.owner));
  }
  return records.filter((record) => record.owner === login.username);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function saveData(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function loadData() {
  const data = getSavedData();
  if (data.length === 0) {
    const defaultRecords = [];
    saveData(defaultRecords);
  }
  refreshUI();
}

function populateMonthSelect() {
  monthSelect.innerHTML = '';
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = `${index + 1}`;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
}

function getMonthKey(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  return `${months[Number(month) - 1]} ${year}`;
}

function groupRecordsByMonth(records) {
  return records.reduce((groups, record) => {
    const key = getMonthKey(record.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});
}

function setMonthSelection(dateString) {
  const date = new Date(dateString);
  const monthValue = String(date.getMonth() + 1);
  if (Array.from(monthSelect.options).some((option) => option.value === monthValue)) {
    monthSelect.value = monthValue;
  }
}

function renderSelectedMonth() {
  const selectedMonth = monthSelect.value || String(new Date().getMonth() + 1);
  const year = new Date().getFullYear();
  const monthKey = `${year}-${selectedMonth}`;
  const records = getOwnedRecords(getSavedData());
  const grouped = groupRecordsByMonth(records);
  const currentMonthRecords = grouped[monthKey] || [];
  const totals = calculateTotals(currentMonthRecords);
  statementTitle.textContent = getMonthLabel(monthKey);
  monthMessage.textContent = currentMonthRecords.length ? 'Current month records below.' : 'No records for this month yet.';
  totalIncomeEl.textContent = `₹${totals.income}`;
  totalExpenseEl.textContent = `₹${totals.expense}`;
  totalBalanceEl.textContent = `${totals.balance < 0 ? '+' : '-'}₹${Math.abs(totals.balance)}`;
  renderRecords(currentMonthRecords);
  renderMonthsSummary(grouped);
}

function calculateTotals(records) {
  return records.reduce(
    (totals, record) => {
      if (record.type === 'income') {
        totals.income += Number(record.amount);
      } else {
        totals.expense += Number(record.amount);
      }
      totals.balance = totals.income - totals.expense;
      return totals;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

function renderRecords(records) {
  recordList.innerHTML = '';
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const count = sortedRecords.length;
  recordCount.textContent = `${count} records`;
  if (!count) {
    recordList.innerHTML = `
      <div class="empty-state">
        <p>No record yet.</p>
        <button type="button" id="emptyAddBtn" class="secondary">Add your first record</button>
      </div>
    `;
    document.getElementById('emptyAddBtn').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.getElementById('recordDate').focus();
    });
    return;
  }
  sortedRecords.forEach((record) => {
    const item = document.createElement('div');
    item.className = 'record-item';
    const typeLabel = record.type === 'income' ? 'Credit' : 'Debit';
    const typeClass = record.type === 'income' ? 'income' : 'expense';
    const amountDisplay = record.type === 'income' ? `₹${record.amount}` : `₹${record.amount}`;
    item.innerHTML = `
      <div class="row">
        <strong>${record.category} - ${amountDisplay}</strong>
        <span class="type-pill ${typeClass}">${typeLabel}</span>
      </div>
      <div class="row">
        <span class="meta">${record.date}</span>
        <span class="meta">Person: ${record.person || '—'}</span>
      </div>
      <div class="row">
        <span class="meta">${record.notes || 'Koi note nathi'}</span>
      </div>
      <div class="actions">
        <button class="edit" data-id="${record.id}">Edit</button>
        <button class="delete" data-id="${record.id}">Delete</button>
      </div>
    `;
    recordList.appendChild(item);
  });
  recordList.querySelectorAll('button.edit').forEach((button) => button.addEventListener('click', handleEditRecord));
  recordList.querySelectorAll('button.delete').forEach((button) => button.addEventListener('click', handleDeleteRecord));
}

function renderMonthsSummary(grouped) {
  monthsSummary.innerHTML = '';
  const monthKeys = Object.keys(grouped).sort((a, b) => new Date(a + '-01') - new Date(b + '-01'));
  if (!monthKeys.length) {
    monthsSummary.innerHTML = '<p style="color:#6b7280;">data not availabel !! </p>';
    return;
  }
  monthKeys.forEach((monthKey) => {
    const totals = calculateTotals(grouped[monthKey]);
    const item = document.createElement('div');
    item.className = 'month-summary-item';
    item.innerHTML = `
      <div>
        <strong>${getMonthLabel(monthKey)}</strong>
        <span>Credit: ₹${totals.income} • Debit: ₹${totals.expense}</span>
      </div>
      <div><strong>Balance ${totals.balance < 0 ? '+' : '-'}₹${Math.abs(totals.balance)}</strong></div>
    `;
    monthsSummary.appendChild(item);
  });
}

function handleRecordSave(event) {
  event.preventDefault();
  const currentUser = getCurrentLogin();
  if (!currentUser || currentUser.type !== 'me') {
    alert('Only personal login can add or edit records.');
    return;
  }
  const id = recordIdInput.value;
  const record = {
    id: id || `rec-${Date.now()}`,
    date: recordDate.value,
    type: recordType.value,
    person: recordPerson.value.trim(),
    amount: Number(recordAmount.value),
    category: recordCategory.value,
    notes: recordNotes.value,
    owner: currentUser.username,
    createdAt: new Date().toISOString(),
  };
  const data = getSavedData();
  if (id) {
    const index = data.findIndex((item) => item.id === id && item.owner === currentUser.username);
    if (index !== -1) {
      data[index] = record;
    }
  } else {
    data.push(record);
  }
  saveData(data);
  setMonthSelection(record.date);
  resetForm();
  refreshUI();
}

function handleEditRecord(event) {
  const currentUser = getCurrentLogin();
  if (!currentUser || currentUser.type !== 'me') return;
  const id = event.target.dataset.id;
  const data = getSavedData();
  const record = data.find((item) => item.id === id && item.owner === currentUser.username);
  if (!record) return;
  recordIdInput.value = record.id;
  recordDate.value = record.date;
  recordType.value = record.type;
  recordPerson.value = record.person || '';
  recordAmount.value = record.amount;
  recordCategory.value = record.category;
  recordNotes.value = record.notes;
  setMonthSelection(record.date);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleDeleteRecord(event) {
  const currentUser = getCurrentLogin();
  if (!currentUser || currentUser.type !== 'me') return;
  const id = event.target.dataset.id;
  const data = getSavedData();
  const filtered = data.filter((item) => item.id !== id || item.owner !== currentUser.username);
  saveData(filtered);
  refreshUI();
}

function resetForm() {
  recordIdInput.value = '';
  const today = new Date().toISOString().slice(0, 10);
  recordDate.value = today;
  recordType.value = 'income';
  recordPerson.value = '';
  recordAmount.value = '';
  recordCategory.value = '';
  recordNotes.value = '';
}

function refreshUI() {
  if (!dashboardScreen.classList.contains('active')) return;
  renderSelectedMonth();
}

function downloadPdf() {
  const selectedMonth = monthSelect.value;
  const year = new Date().getFullYear();
  const monthKey = `${year}-${selectedMonth}`;
  const grouped = groupRecordsByMonth(getOwnedRecords(getSavedData()));
  const records = grouped[monthKey] || [];
  const totals = calculateTotals(records);
  const title = `Statement_${getMonthLabel(monthKey)}`;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const colWidths = [45, 70, 70, 70, 70, 80];
  const tableX = margin;
  let y = 50;

  doc.setFontSize(18);
  doc.text('Mahina Wise Statement', margin, y);
  y += 28;
  doc.setFontSize(11);
  doc.text(`Month: ${getMonthLabel(monthKey)}`, margin, y);
  y += 22;
  doc.text(`Credit Total: ₹${totals.income}`, margin, y);
  y += 16;
  doc.text(`Debit Total: ₹${totals.expense}`, margin, y);
  y += 16;
  doc.text(`Balance: ${totals.balance < 0 ? '-' : ''}₹${Math.abs(totals.balance)}`, margin, y);
  y += 28;

  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('Records', margin, y);
  y += 16;

  const drawRow = (cells, isHeader = false) => {
    const rowHeight = isHeader ? 20 : 18;
    const xPositions = [];
    let x = tableX;
    colWidths.forEach((width) => {
      xPositions.push(x);
      x += width;
    });

    if (isHeader) {
      doc.setFillColor(240, 240, 240);
      doc.rect(tableX, y, pageWidth - margin * 2, rowHeight, 'F');
    }

    cells.forEach((cell, index) => {
      const text = String(cell);
      const xPos = xPositions[index];
      const maxWidth = colWidths[index] - 8;
      const split = doc.splitTextToSize(text, maxWidth);
      doc.setFont(undefined, isHeader ? 'bold' : 'normal');
      doc.text(split, xPos + 4, y + 13);
    });

    y += rowHeight;
    return y;
  };

  if (records.length === 0) {
    doc.setFontSize(11);
    doc.text('No records available for this month.', margin, y);
  } else {
    drawRow(['Date', 'Type', 'Person', 'Category', 'Amount', 'Notes'], true);
    records.forEach((record) => {
      const amountText = `₹${record.amount}`;
      drawRow([
        record.date,
        record.type === 'income' ? 'Credit' : 'Debit',
        record.person || 'N/A',
        record.category,
        amountText,
        record.notes || 'N/A'
      ]);
      if (y > 760) {
        doc.addPage();
        y = 50;
        drawRow(['Date', 'Type', 'Person', 'Category', 'Amount', 'Notes'], true);
      }
    });
  }

  doc.save(`${title}.pdf`);
}

init();
