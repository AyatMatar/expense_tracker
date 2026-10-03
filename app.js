const API_URL = "http://localhost:3000/api/expenses";

const expensesTableBody = document.getElementById("expensesTableBody");
const expenseForm = document.getElementById("expenseForm");

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const expenseDateInput = document.getElementById("expenseDate");

const filterCategory = document.getElementById("filterCategory");

const alertContainer = document.getElementById("alertContainer");
const loadingSpinner = document.getElementById("loadingSpinner");

const editExpenseForm = document.getElementById("editExpenseForm");
const editExpenseId = document.getElementById("editExpenseId");
const editTitle = document.getElementById("editTitle");
const editAmount = document.getElementById("editAmount");
const editCategory = document.getElementById("editCategory");
const editExpenseDate = document.getElementById("editExpenseDate");


// =========================
// Alert
// =========================

const showAlert = (message, type = "success") => {

    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}

            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="alert">
            </button>
        </div>
    `;
};


// =========================
// Spinner
// =========================

const showSpinner = () => {
    loadingSpinner.classList.remove("d-none");
};

const hideSpinner = () => {
    loadingSpinner.classList.add("d-none");
};


// =========================
// GET Expenses
// =========================

const loadExpenses = async () => {

    try {

        showSpinner();

        const category_id = filterCategory.value;

        let url = API_URL;

        if (category_id) {
            url += `?category_id=${category_id}`;
        }

        const response = await fetch(url);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to load expenses");
        }

        const expenses = result.data;

        expensesTableBody.innerHTML = "";

        expenses.forEach((expense, index) => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${expense.title}</td>
                <td>${expense.amount}</td>
               <td>
                    <span class="category-badge category-${expense.category.toLowerCase()}">
                        ${expense.category}
                    </span>
               </td>
                <td>${expense.expense_date}</td>

                <td>
                    <button
                        class="btn btn-info btn-sm"
                        onclick="editExpense(${expense.id})">
                        Edit
                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteExpense(${expense.id})">
                        Delete
                    </button>
                </td>
            `;

            expensesTableBody.appendChild(row);
        });

    } catch (error) {

        console.error("GET ERROR:", error);

        showAlert("Failed to load expenses.", "danger");

    } finally {

        hideSpinner();

    }
};

// Load Summary
const loadSummary = async () => {
    try {
        const response = await fetch(
            "http://localhost:3000/api/expenses/summary"
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Failed to load summary"
            );
        }

        document.getElementById("totalAmount").textContent =
            result.total.toFixed(2);

        document.getElementById("expenseCount").textContent =
            result.count;

        document.getElementById("highestExpense").textContent =
            result.highest.toFixed(2);

    } catch (error) {
        showAlert(
            "Failed to load expense summary.",
            "danger"
        );
    }
};
// =========================
// POST Expense
// =========================

expenseForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const category_id = Number(categoryInput.value);
    const expense_date = expenseDateInput.value;

    if (!title || !amount || amount <= 0 || !category_id || !expense_date) {

        showAlert(
            "Please enter valid expense data.",
            "warning"
        );

        return;
    }

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title,
                amount,
                category_id,
                expense_date
            })
        });

        const result = await response.json();

        if (!response.ok) {

            showAlert(
                result.error || "Failed to add expense",
                "danger"
            );

            return;
        }

        showAlert(
            "Expense added successfully!",
            "success"
        );

        expenseForm.reset();

        await loadExpenses();
        await loadSummary();
    } catch (error) {

        console.error("POST ERROR:", error);

        showAlert(
            "Something went wrong while adding the expense.",
            "danger"
        );
    }
});


// =========================
// EDIT Expense
// =========================

const editExpense = async (id) => {

    try {

        const response = await fetch(`${API_URL}/${id}`);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Failed to load expense"
            );
        }

        const expense = result;

        if (!expense) {

            showAlert(
                "Expense not found.",
                "danger"
            );

            return;
        }

        editExpenseId.value = expense.id;
        editTitle.value = expense.title;
        editAmount.value = expense.amount;
        editCategory.value = expense.category_id;
        editExpenseDate.value = expense.expense_date;

        const modal = new bootstrap.Modal(
            document.getElementById("editExpenseModal")
        );

        modal.show();

    } catch (error) {

        console.error("EDIT ERROR:", error);

        showAlert(
            "Failed to load expense.",
            "danger"
        );
    }
};


// =========================
// PUT Expense
// =========================

editExpenseForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const id = editExpenseId.value;

    const title = editTitle.value.trim();
    const amount = Number(editAmount.value);
    const category_id = Number(editCategory.value);
    const expense_date = editExpenseDate.value;

    if (!title || !amount || amount <= 0 || !category_id || !expense_date) {

        showAlert(
            "Please enter valid expense data.",
            "warning"
        );

        return;
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title,
                amount,
                category_id,
                expense_date
            })
        });

        const result = await response.json();


        if (!response.ok) {

            showAlert(
                result.error || "Failed to update expense",
                "danger"
            );

            return;
        }

        showAlert(
            "Expense updated successfully!",
            "success"
        );

        const modalElement =
            document.getElementById("editExpenseModal");

        const modal =
            bootstrap.Modal.getInstance(modalElement);

        modal.hide();

        await loadExpenses();
        await loadSummary();

    } catch (error) {

        console.error("PUT ERROR:", error);

        showAlert(
            "Something went wrong while updating the expense.",
            "danger"
        );
    }
});


// =========================
// DELETE Expense
// =========================

const deleteExpense = async (id) => {

    const confirmed = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {

            method: "DELETE"
        });

        const result = await response.json();


        if (!response.ok) {

            showAlert(
                result.error || "Failed to delete expense",
                "danger"
            );

            return;
        }

        showAlert(
            "Expense deleted successfully!",
            "success"
        );

        await loadExpenses();
        await loadSummary();

    } catch (error) {

        console.error("DELETE ERROR:", error);

        showAlert(
            "Something went wrong while deleting the expense.",
            "danger"
        );
    }
};


// =========================
// Filter
// =========================

filterCategory.addEventListener("change", () => {
    loadExpenses();
    loadSummary();
});


// =========================
// Load data when page opens
// =========================


loadExpenses();
loadSummary();