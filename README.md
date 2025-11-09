# Proposal Manager

Node.js + Express + EJS + SQLite app to create, edit, preview, and export business proposals to PDF. Uses Puppeteer to render the HTML template to a high-fidelity PDF.

## Quick start

1. Install dependencies (already added):

```bash
npm install
```

2. Start the server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Features

- CRUD for proposals (company, person, plan, date, amount)
- Live preview that updates proposal content in real-time
- Professional proposal layout derived from the provided HTML template
- Print-friendly view and PDF export powered by Puppeteer
- SQLite storage using `better-sqlite3`

## Scripts

- `npm run dev` – start in development (nodemon)
- `npm start` – start in production

## Notes

- PDFs render the same HTML you see in preview at `/proposals/:id/print` to ensure consistent layout.



