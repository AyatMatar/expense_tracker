const pool = require("../db");

// GET all expenses
const getExpenses = async (req, res) => {
    try {
        const {
            category_id,
            from,
            to,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
            return res.status(400).json({
                error: "Page must be a positive integer"
            });
        }

        if (!Number.isInteger(limitNumber) || limitNumber <= 0) {
            return res.status(400).json({
                error: "Limit must be a positive integer"
            });
        }

        const offset = (pageNumber - 1) * limitNumber;

        let whereClause = "WHERE 1 = 1";
        const values = [];

        if (category_id) {
            values.push(category_id);
            whereClause += ` AND e.category_id = $${values.length}`;
        }

        if (from) {
            values.push(from);
            whereClause += ` AND e.expense_date >= $${values.length}`;
        }

        if (to) {
            values.push(to);
            whereClause += ` AND e.expense_date <= $${values.length}`;
        }

        if (search) {
            values.push(`%${search}%`);
            whereClause += ` AND e.title ILIKE $${values.length}`;
        }

        const countQuery = `
            SELECT COUNT(*)
            FROM expenses e
            ${whereClause}
        `;

        const countResult = await pool.query(countQuery, values);

        const totalItems = Number(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limitNumber);

        const dataValues = [...values, limitNumber, offset];

        const query = `
            SELECT
                e.id,
                e.title,
                e.amount::float AS amount,
                TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS expense_date,
                e.created_at,
                c.id AS category_id,
                c.name AS category
            FROM expenses e
            INNER JOIN categories c
                ON e.category_id = c.id
            ${whereClause}
            ORDER BY e.id DESC
            LIMIT $${dataValues.length - 1}
            OFFSET $${dataValues.length}
        `;

        const result = await pool.query(query, dataValues);

        res.json({
            data: result.rows,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalItems,
                totalPages
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to get expenses"
        });
    }
};

// GET get Expense By Id
const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(404).json({
                error: "Expense not found"
            });
        }

        const result = await pool.query(
            `
            SELECT
                e.id,
                e.title,
                e.amount::float AS amount,
                TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS expense_date,
                e.created_at,
                c.id AS category_id,
                c.name AS category
            FROM expenses e
            INNER JOIN categories c
                ON e.category_id = c.id
            WHERE e.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Expense not found"
            });
        }

        const expense = result.rows[0];

        res.json(expense);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to get expense"
        });
    }
};
// GET expenses summary
const getExpenseSummary = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS count,
                COALESCE(MAX(amount), 0) AS highest
            FROM expenses
        `);

        const summary = result.rows[0];

        res.json({
            total: Number(summary.total),
            count: Number(summary.count),
            highest: Number(summary.highest)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to get expense summary"
        });
    }
};

const isValidDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
    );
};

// POST expense
const addExpense = async (req, res) => {
    try {
        const { title, amount, category_id, expense_date } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                error: "Title is required"
            });
        }

        const numericAmount = Number(amount);

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                error: "Amount must be greater than 0"
            });
        }

        const numericCategoryId = Number(category_id);

        if (
            !Number.isInteger(numericCategoryId) ||
            numericCategoryId <= 0
        ) {
            return res.status(400).json({
                error: "Valid category is required"
            });
        }

        if (!expense_date) {
            return res.status(400).json({
                error: "Expense date is required"
            });
        }

        if (!isValidDate(expense_date)) {
            return res.status(400).json({
                error: "Expense date must be in YYYY-MM-DD format"
            });
        }

        const categoryResult = await pool.query(
            "SELECT id FROM categories WHERE id = $1",
            [numericCategoryId]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                error: "Category not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO expenses
                (title, amount, category_id, expense_date)
            VALUES
                ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                title.trim(),
                numericAmount,
                numericCategoryId,
                expense_date
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to add expense"
        });
    }
};

// PUT expense
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category_id, expense_date } = req.body;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(404).json({
                error: "Expense not found"
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                error: "Title is required"
            });
        }

        const numericAmount = Number(amount);

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                error: "Amount must be greater than 0"
            });
        }

        const numericCategoryId = Number(category_id);

        if (
            !Number.isInteger(numericCategoryId) ||
            numericCategoryId <= 0
        ) {
            return res.status(400).json({
                error: "Valid category is required"
            });
        }

        if (!expense_date) {
            return res.status(400).json({
                error: "Expense date is required"
            });
        }

        const categoryResult = await pool.query(
            "SELECT id FROM categories WHERE id = $1",
            [numericCategoryId]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                error: "Category not found"
            });
        }

        const result = await pool.query(
            `
            UPDATE expenses
            SET
                title = $1,
                amount = $2,
                category_id = $3,
                expense_date = $4
            WHERE id = $5
            RETURNING *
            `,
            [
                title.trim(),
                numericAmount,
                numericCategoryId,
                expense_date,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Expense not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to update expense"
        });
    }
};

// DELETE expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(404).json({
                error: "Expense not found"
            });
        }

        const result = await pool.query(
            "DELETE FROM expenses WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Expense not found"
            });
        }

        res.json({
            message: "Expense deleted successfully",
            expense: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to delete expense"
        });
    }
};

module.exports = {
    getExpenses,
    getExpenseById,
    getExpenseSummary,
    addExpense,
    updateExpense,
    deleteExpense
};