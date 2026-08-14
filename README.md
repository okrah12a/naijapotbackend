# Naija Pot — Backend API

Node.js/Express backend for Naija Pot: user accounts, admin login, menu
management, and order handling — built to replace the current
WhatsApp-only checkout with real accounts and (later) online payment.

## Stack

- **Node.js + Express** — API server
- **PostgreSQL** — database
- **Prisma** — ORM / schema / migrations
- **JWT + bcrypt** — authentication
- **express-validator, helmet, express-rate-limit** — basic hardening

### Why this stack
Postgres + Prisma gives you real relations (users → orders → order items →
menu items) with type-safe queries, which matters once you add payments and
need accurate order history. JWT auth is stateless and works cleanly with a
separate frontend (your current HTML page, or a future React app) and later
with a mobile app if you ever want one.

## 1. Install

```bash
npm install
```

## 2. Database

Pick one (all have free tiers, sorted by ease of setup for a project this size):

1. **[Neon](https://neon.tech)** — serverless Postgres, generous free tier, instant setup. Recommended.
2. **[Supabase](https://supabase.com)** — Postgres + built-in auth/storage if you want to grow into that later.
3. **[Railway](https://railway.app)** — one-click Postgres, easy to deploy the API alongside it.

Copy the connection string into `.env` as `DATABASE_URL`.

## 3. Configure environment

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — from step 2
- `JWT_SECRET` — any long random string (`openssl rand -hex 32` works well)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the first admin account (change the password after first login)

## 4. Create the database tables

```bash
npm run prisma:migrate
```

## 5. Seed the first admin + a starter menu

```bash
npm run seed
```

This creates one ADMIN user (from your `.env`) and a handful of menu items
so the frontend has something to show immediately. Add your real menu
through the admin dashboard endpoints once the API is running, then delete
the placeholder items you don't want.

## 6. Run it

```bash
npm run dev     # with auto-reload
npm start       # plain node
```

API will be live at `http://localhost:5000/api`.

## Deploying

Any of these work well for a small Express + Postgres app:
- **Railway** or **Render** — easiest, connects straight to GitHub, free tier available
- **Fly.io** — a bit more setup, good performance

Whichever you pick, set the same environment variables from `.env` in the
host's dashboard, and point `DATABASE_URL` at your production database.

---

## API Reference

All request/response bodies are JSON. Protected routes require
`Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create a customer account. Body: `{ name, email, password, phone? }` |
| POST | `/login` | — | Log in as any user. Body: `{ email, password }`. Returns `{ token, user }` |
| POST | `/admin/login` | — | Same as above, but returns `403` if the account isn't an ADMIN |
| GET | `/me` | any | Current user's profile |

### Menu — `/api/menu`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List available menu items. Admins can add `?all=true` to include unavailable ones |
| GET | `/:id` | — | Get one item |
| POST | `/` | ADMIN | Create item. Body: `{ name, price, category, description?, imageUrl?, available? }` |
| PUT | `/:id` | ADMIN | Update item (partial body accepted) |
| DELETE | `/:id` | ADMIN | Remove item |

### Orders — `/api/orders`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | customer | Place an order. Body: `{ items: [{ menuItemId, quantity }], fulfilment: "DELIVERY"\|"PICKUP", deliveryAddress?, notes? }`. Prices are taken from the DB, not the client. |
| GET | `/me` | customer | The logged-in user's own order history |
| GET | `/` | ADMIN | All orders. Optional `?status=PENDING` filter |
| PATCH | `/:id/status` | ADMIN | Update status. Body: `{ status }` — one of `PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, COMPLETED, CANCELLED` |

### Admin — `/api/admin`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/users` | ADMIN | List registered customers with their order counts |
| GET | `/dashboard/summary` | ADMIN | Quick stats: total users, orders, menu items, pending orders, revenue |

---

## Notes for hooking up the frontend

- On login/register, store the returned `token` (localStorage or a cookie)
  and send it as `Authorization: Bearer <token>` on every subsequent request.
- Check `user.role` after login to decide whether to route to the customer
  view or the admin dashboard.
- The current `naijapot_1.html` builds its cart from a hardcoded `MENU`
  object and checks out via a `wa.me` link — once this API is live, swap
  that for a `fetch('/api/menu')` call to populate the cart, and change
  `sendOrder()` to `POST /api/orders` instead of opening WhatsApp.
- Online payment (Paystack/Flutterwave are the standard choices for Naira
  payments) can slot in after `POST /api/orders` creates a PENDING order:
  charge the card, then flip the order to CONFIRMED on successful payment.
