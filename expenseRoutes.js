const express = require("express");

const {
    getExpenses,
    getExpenseById,
    getExpenseSummary,
    addExpense,
    updateExpense,
    deleteExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.get("/", getExpenses);

router.get("/summary", getExpenseSummary);

router.get("/:id", getExpenseById);

router.post("/", addExpense);

router.put("/:id", updateExpense);

router.delete("/:id", deleteExpense);

module.exports = router;