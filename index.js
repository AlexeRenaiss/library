import express from "express";
import mysql from "mysql2/promise";
const app = express();
const port = 8000;
// Middleware to parse JSON bodies
app.use(express.json());
// Create a connection pool to the database
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "library",
};
// Function to connect to the database and execute queries
async function executeQuery(query, params) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    await connection.end();
  }
}
app.post("/books", async (req, res) => {
  const { title, author, isbn } = req.body;

  // Validate input
  if (!title || !author || !isbn) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = "INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)";
    const results = await executeQuery(query, [title, author, isbn]);

    // Check if the insert was successful
    if (results.affectedRows === 1) {
      res.status(201).json({
        id: results.insertId,
        title,
        author,
        isbn,
        message: "Book added successfully",
      });
    } else {
      res.status(500).json({ error: "Failed to add book" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    const query = "SELECT * FROM books WHERE id=?";
    const book = await executeQuery(query, [bookId]);
    if (book.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    const deleteQuery = "DELETE FROM books WHERE id=?";
    const result = await executeQuery(deleteQuery, [bookId]);
    if (result.affectedRows === 1) {
      res
        .status(200)
        .json({ message: "Book deleted successfully", id: bookId });
    } else {
      res.status(500).json({ error: "Failed to delete book", id: bookId });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.put("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, author, isbn } = req.body;
    // Validate input
    if (!title && !author && !isbn) {
      return res.status(400).json({
        error:
          "At least one field (title, author, or isbn) is required for update",
      });
    }
    const query = "SELECT * FROM books WHERE id =?";
    const book = executeQuery(query, [bookId]);
    if (book.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    const updateQuery =
      "UPDATE books SET title =?, author =?, isbn =? WHERE id=?";
    const result = executeQuery(updateQuery, [title, author, isbn, bookId]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ error: "Book not found" });
    }
    res.send({ message: "Book updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/books", async (req, res) => {
  try {
    const query = "SELECT * FROM books";
    const results = await executeQuery(query);

    if (results.length === 0) {
      return res.status(204).json({ message: "No books found" });
    }

    res.status(200).json({
      count: results.length,
      books: results,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
