const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDoc = require("./openapi.json");
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "tasks.db");

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )`);

  const count = db.exec("SELECT COUNT(*) AS c FROM tasks");
  if (count[0].values[0][0] === 0) {
    db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", ["Buy groceries", 0]);
    db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", ["Read a book", 1]);
    db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", ["Walk the dog", 0]);
  }
  saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Temporary: keep old array endpoints until we swap them out per stage
let tasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Read a book", done: true },
  { id: 3, title: "Walk the dog", done: false },
];
let nextId = 4;

app.get("/", (req, res) => {
  res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  const rows = db.exec("SELECT id, title, done FROM tasks");
  if (!rows.length) return res.json([]);
  const tasks = rows[0].values.map(([id, title, done]) => ({
    id,
    title,
    done: !!done,
  }));
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const stmt = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?");
  stmt.bind([parseInt(req.params.id)]);
  if (stmt.step()) {
    const [id, title, done] = stmt.get();
    stmt.free();
    return res.json({ id, title, done: !!done });
  }
  stmt.free();
  res.status(404).json({ error: `Task ${req.params.id} not found` });
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required and must be a non-empty string" });
  }
  const task = { id: nextId++, title: title.trim(), done: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === parseInt(req.params.id));
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  const { title, done } = req.body;
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Title must be a non-empty string" });
    }
    task.title = title.trim();
  }
  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "Done must be a boolean" });
    }
    task.done = done;
  }
  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  tasks.splice(index, 1);
  res.status(204).send();
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
