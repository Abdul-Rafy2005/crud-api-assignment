# Task API

A simple CRUD REST API for managing tasks, built with Node.js and Express. Data is stored in a SQLite database (`tasks.db`), which persists automatically and survives server restarts.

## Install & Run

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`. Interactive API docs available at `http://localhost:3000/docs`.

## Why SQLite?

SQLite was chosen because it needs zero setup — no server to install or configure, just a single file (`tasks.db`). It's created automatically on first run, and unlike in-memory storage, data survives a server restart.

## Where the Database Lives

The database file `tasks.db` is created automatically on first run and is git-ignored, so a fresh clone always starts with a clean database and the 3 seeded tasks.

## Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/` | API info | 200 |
| GET | `/health` | Health check | 200 |
| GET | `/tasks` | List all tasks | 200 |
| GET | `/tasks/:id` | Get a task by ID | 200 / 404 |
| POST | `/tasks` | Create a task | 201 / 400 |
| PUT | `/tasks/:id` | Update a task | 200 / 400 / 404 |
| DELETE | `/tasks/:id` | Delete a task | 204 / 404 |

## Example Request & Response

```bash
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Learn SQLite"}'
```

```
HTTP/1.1 201 Created
Content-Type: application/json

{"id":4,"title":"Learn SQLite","done":false}
```

## Exploring the Database Directly

Open `tasks.db` in [DB Browser for SQLite](https://sqlitebrowser.org/) and run:

```sql
SELECT * FROM tasks;
```

This returns every row with its `id`, `title`, and `done` (0/1) — the full contents of the tasks table.

<!-- TODO: Add DB Browser screenshot here -->

## Swagger UI

Interactive API documentation is served at `http://localhost:3000/docs`.

![Swagger UI](Swagger.png)
