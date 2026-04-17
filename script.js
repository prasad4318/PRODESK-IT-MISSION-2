// State Management
let state = {
    salary: 0,
    expenses: [],
    chart: null
};

// DOM Elements
const salaryInput = document.getElementById('totalSalary');
const expenseForm = document.getElementById('expenseForm');
const expenseNameInput = document.getElementById('expenseName');
const expenseCategoryInput = document.getElementById('expenseCategory');
const expenseAmountInput = document.getElementById('expenseAmount');
const expenseList = document.getElementById('expenseList');
const remainingBalanceDisplay = document.getElementById('remainingBalance');
const totalExpensesDisplay = document.getElementById('totalExpensesAmount');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initChart();
    updateUI();
    
    // Event Listeners
    salaryInput.addEventListener('input', handleSalaryChange);
    expenseForm.addEventListener('submit', handleAddExpense);
});

// Load Data from LocalStorage
function loadData() {
    const savedSalary = localStorage.getItem('cashFlow_salary');
    const savedExpenses = localStorage.getItem('cashFlow_expenses');
    
    if (savedSalary) {
        state.salary = parseFloat(savedSalary);
        salaryInput.value = state.salary > 0 ? state.salary : '';
    }
    
    if (savedExpenses) {
        state.expenses = JSON.parse(savedExpenses);
    }
}

// Save Data to LocalStorage
function saveData() {
    localStorage.setItem('cashFlow_salary', state.salary);
    localStorage.setItem('cashFlow_expenses', JSON.stringify(state.expenses));
}

// Handle Salary Change
function handleSalaryChange(e) {
    const value = parseFloat(e.target.value) || 0;
    state.salary = value < 0 ? 0 : value;
    saveData();
    updateUI();
}

// Handle Add Expense
function handleAddExpense(e) {
    e.preventDefault();
    
    const name = expenseNameInput.value.trim();
    const category = expenseCategoryInput.value;
    const amount = parseFloat(expenseAmountInput.value);
    
    // Validation
    if (!name || !category || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid expense name, select a category, and enter a positive amount.");
        return;
    }
    
    const newExpense = {
        id: Date.now(),
        name: name,
        category: category,
        amount: amount,
        date: new Date().toLocaleDateString()
    };
    
    state.expenses.unshift(newExpense); // Add to the beginning
    saveData();
    updateUI();
    
    // Reset form
    expenseForm.reset();
}

// Delete Expense
function deleteExpense(id) {
    state.expenses = state.expenses.filter(exp => exp.id !== id);
    saveData();
    updateUI();
}

// Calculate Totals
function calculateTotals() {
    const totalExpenses = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = state.salary - totalExpenses;
    return { totalExpenses, balance };
}

// Update UI
function updateUI() {
    const { totalExpenses, balance } = calculateTotals();
    
    // Update balance and expense displays
    remainingBalanceDisplay.textContent = `₹${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    totalExpensesDisplay.textContent = `₹${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Color balance red if negative
    remainingBalanceDisplay.style.color = balance < 0 ? '#f43f5e' : '#10b981';

    // Update Expense List
    renderExpenseList();
    
    // Update Chart
    updateChart(totalExpenses, balance);
}

// Render Expense List
function renderExpenseList() {
    if (state.expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="receipt-text"></i>
                <p>No expenses added yet.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    expenseList.innerHTML = state.expenses.map(exp => {
        const catClass = `cat-${exp.category.toLowerCase()}`;
        return `
        <li class="expense-item">
            <div class="expense-info">
                <span class="expense-name">
                    ${exp.name}
                    <span class="category-badge ${catClass}">${exp.category}</span>
                </span>
                <span class="expense-date">${exp.date}</span>
            </div>
            <div class="expense-right">
                <span class="expense-amount">-₹${exp.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="deleteExpense(${exp.id})" title="Delete Expense">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </li>
    `;}).join('');
    
    // Refresh icons
    lucide.createIcons();
}

// Initialize Chart.js
function initChart() {
    const ctx = document.getElementById('flowChart').getContext('2d');
    
    state.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#f59e0b', // Food
                    '#3b82f6', // Transport
                    '#8b5cf6', // Housing
                    '#ec4899', // Shopping
                    '#10b981', // Entertainment
                    '#6b7280'  // Others
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#64748b',
                        font: {
                            family: 'Outfit',
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: 'Outfit' },
                    bodyFont: { family: 'Outfit' },
                    padding: 12,
                    displayColors: false
                }
            }
        }
    });
}

// Update Chart Data
function updateChart(totalExpenses, balance) {
    if (!state.chart) return;
    
    // Group expenses by category
    const categoryTotals = {};
    const categories = ['Food', 'Transport', 'Housing', 'Shopping', 'Entertainment', 'Others'];
    
    categories.forEach(cat => categoryTotals[cat] = 0);
    state.expenses.forEach(exp => {
        if (categoryTotals[exp.category] !== undefined) {
            categoryTotals[exp.category] += exp.amount;
        } else {
            categoryTotals['Others'] += exp.amount;
        }
    });

    // Filtering out categories with 0 to make chart cleaner if needed
    // However, keeping consistent order is often better. Let's filter for visual clarity.
    const activeData = categories
        .map(cat => ({ label: cat, value: categoryTotals[cat] }))
        .filter(item => item.value > 0);

    // If no expenses, show a placeholder
    if (activeData.length === 0) {
        state.chart.data.labels = ['No Expenses'];
        state.chart.data.datasets[0].data = [1];
        state.chart.data.datasets[0].backgroundColor = ['rgba(0,0,0,0.05)'];
    } else {
        state.chart.data.labels = activeData.map(d => d.label);
        state.chart.data.datasets[0].data = activeData.map(d => d.value);
        // Reset colors to match categories
        const colorMap = {
            'Food': '#f59e0b',
            'Transport': '#3b82f6',
            'Housing': '#8b5cf6',
            'Shopping': '#ec4899',
            'Entertainment': '#10b981',
            'Others': '#6b7280'
        };
        state.chart.data.datasets[0].backgroundColor = activeData.map(d => colorMap[d.label]);
    }
    
    state.chart.update();
}
