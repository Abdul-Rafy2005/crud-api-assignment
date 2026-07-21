# Task API

A simple CRUD REST API for managing tasks, built with Node.js and Express. Data is stored in memory (no database).

## Install & Run

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`. Interactive API docs available at `http://localhost:3000/docs`.

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
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Learn Express"}'
```

```
HTTP/1.1 201 Created
Content-Type: application/json

{"id":4,"title":"Learn Express","done":false}
```

## Swagger UI

Interactive API documentation is served at `http://localhost:3000/docs`.

<!-- TODO: Add Swagger UI screenshot here -->
