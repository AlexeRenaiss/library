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
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const query = 'INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)';
    const results = await executeQuery(query, [title, author, isbn]);
    
    // Check if the insert was successful
    if (results.affectedRows === 1) {
      res.status(201).json({ 
        id: results.insertId, 
        title, 
        author, 
        isbn,
        message: 'Book added successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to add book' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    const query = "DELETE FROM books WHERE id=?";
    const result = await executeQuery(query, [bookId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(201).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "Error deleting book" });
  }
});
app.put("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, author, isbn } = req.body;
    const query = "UPDATE books SET title =?, author =?, isbn =? WHERE id=?";
    const result = await executeQuery(query, [title, author, isbn, bookId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(201).json({
      id: bookId,
      title,
      author,
      isbn,
      message: "Book updated successfully",
    });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Error adding book" });
  }
});
app.get("/books", async (req, res) => {
  try {
    const query = 'SELECT * FROM books';
    const results = await executeQuery(query);
    
    if (results.length === 0) {
      return res.status(204).json({ message: 'No books found' });
    }
    
    res.status(200).json({
      count: results.length,
      books: results
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
