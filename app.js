const form = document.getElementById('movement-form');
const conceptInput = document.getElementById('concept');
const typeInput = document.getElementById('type');
const amountInput = document.getElementById('amount');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const balanceEl = document.getElementById('balance');
const savingsRateEl = document.getElementById('savings-rate');
const historyListEl = document.getElementById('history-list');
const clearAllBtn = document.getElementById('clear-all');
const goalInput = document.getElementById('goal');
const saveGoalBtn = document.getElementById('save-goal');
const goalProgressBar = document.getElementById('goal-progress-bar');
const goalStatus = document.getElementById('goal-status');

const storageKey = 'finanzas-data-v1';

const state = loadState();
render();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const concept = conceptInput.value.trim();
  const type = typeInput.value;
  const amount = Number(amountInput.value);

  if (!concept || !amount || amount <= 0) {
    return;
  }

  state.movements.unshift({
    id: crypto.randomUUID(),
    concept,
    type,
    amount,
    createdAt: new Date().toISOString(),
  });

  form.reset();
  persist();
  render();
});

clearAllBtn.addEventListener('click', () => {
  state.movements = [];
  persist();
  render();
});

saveGoalBtn.addEventListener('click', () => {
  const goal = Number(goalInput.value);
  state.goal = Number.isFinite(goal) && goal >= 0 ? goal : 0;
  persist();
  render();
});

function loadState() {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return { movements: [], goal: 0 };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      goal: Number(parsed.goal) || 0,
    };
  } catch {
    return { movements: [], goal: 0 };
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function render() {
  const totals = state.movements.reduce(
    (acc, movement) => {
      if (movement.type === 'income') {
        acc.income += movement.amount;
      } else {
        acc.expense += movement.amount;
      }

      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? (balance / totals.income) * 100 : 0;

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpenseEl.textContent = formatCurrency(totals.expense);
  balanceEl.textContent = formatCurrency(balance);
  savingsRateEl.textContent = `${savingsRate.toFixed(1)}%`;

  goalInput.value = state.goal > 0 ? String(state.goal) : '';
  updateGoal(balance, state.goal);
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = '';

  if (state.movements.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Aún no hay movimientos registrados.';
    historyListEl.appendChild(empty);
    return;
  }

  state.movements.forEach((movement) => {
    const li = document.createElement('li');
    const left = document.createElement('span');
    const right = document.createElement('span');

    left.textContent = movement.concept;
    right.textContent = `${movement.type === 'income' ? '+' : '-'} ${formatCurrency(
      movement.amount
    )}`;
    right.className = `amount ${movement.type}`;

    li.append(left, right);
    historyListEl.appendChild(li);
  });
}

function updateGoal(balance, goal) {
  if (goal <= 0) {
    goalProgressBar.style.width = '0%';
    goalStatus.textContent = 'Define una meta para ver tu progreso.';
    return;
  }

  const progress = Math.max(0, Math.min(100, (balance / goal) * 100));
  goalProgressBar.style.width = `${progress}%`;

  if (balance >= goal) {
    goalStatus.textContent = `¡Meta cumplida! Has superado tu objetivo mensual de ${formatCurrency(goal)}.`;
    return;
  }

  const missing = goal - Math.max(balance, 0);
  goalStatus.textContent = `Te faltan ${formatCurrency(missing)} para cumplir tu meta de ahorro.`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}
