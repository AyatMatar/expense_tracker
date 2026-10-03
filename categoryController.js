const pool = require("../db");

const getCategories = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM categories ORDER BY id"
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to get categories"
        });
    }
};

module.exports = {
    getCategories
};