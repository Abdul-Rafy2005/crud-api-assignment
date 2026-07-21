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

// In-memory array removed — all data now lives in tasks.db

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
  db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", [title.trim(), 0]);
  const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  saveDB();
  res.status(201).json({ id, title: title.trim(), done: false });
});

app.put("/tasks/:id", (req, res) => {
  const stmt = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?");
  stmt.bind([parseInt(req.params.id)]);
  if (!stmt.step()) {
    stmt.free();
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  const [id, , currentDone] = stmt.get();
  stmt.free();

  const { title, done } = req.body;
  let newTitle = null;
  let newDone = currentDone;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Title must be a non-empty string" });
    }
    newTitle = title.trim();
  }
  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "Done must be a boolean" });
    }
    newDone = done ? 1 : 0;
  }

  if (newTitle !== null) {
    db.run("UPDATE tasks SET title = ?, done = ? WHERE id = ?", [newTitle, newDone, id]);
  } else {
    db.run("UPDATE tasks SET done = ? WHERE id = ?", [newDone, id]);
  }
  saveDB();

  const updated = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?");
  updated.bind([id]);
  updated.step();
  const [rid, rtitle, rdone] = updated.get();
  updated.free();
  res.json({ id: rid, title: rtitle, done: !!rdone });
});

app.delete("/tasks/:id", (req, res) => {
  const stmt = db.prepare("SELECT id FROM tasks WHERE id = ?");
  stmt.bind([parseInt(req.params.id)]);
  if (!stmt.step()) {
    stmt.free();
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  stmt.free();
  db.run("DELETE FROM tasks WHERE id = ?", [parseInt(req.params.id)]);
  saveDB();
  res.status(204).send();
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
