const express = require("express");
const cors = require("cors");

const expenseRoutes = require("./routes/expenseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});