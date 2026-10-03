-- Create categories table
CREATE TABLE categories ( id SERIAL PRIMARY KEY,  name VARCHAR(50) NOT NULL UNIQUE );

-- Insert categories
INSERT INTO categories (name)
VALUES
('Food'),
('Transport'),
('Bills'),
('Entertainment'),
('Other');

-- Create expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category_id INTEGER NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_categories FOREIGN KEY (category_id) REFERENCES categories(id)
);