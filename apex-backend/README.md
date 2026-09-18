# Apex Software Backend

I have created a fully functional Node.js API (Express + In-Memory Database) for your Client Portal.
This allows real users to register, login, and fetch invoices.

## How to run it:
1. Open a new terminal in this folder (`C:\Users\ASUS\Desktop\New folder\apex-backend`).
2. Run `npm start`
3. The server will run on `http://localhost:3000`.

## Endpoints:
- `POST /api/register` (fullName, email, company, password)
- `POST /api/login` (email, password)
- `GET /api/invoices` (Returns invoices)

Enjoy!
