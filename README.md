# PollZone 🔥

A fun interactive polling website with real vote counts stored in a database.

---

## 🚀 Deploy on Render (Step by Step)

### 1. Push to GitHub
- Create a new repo on github.com
- Upload all these files to it

### 2. Create a PostgreSQL Database on Render
- Go to render.com → New → PostgreSQL
- Name it `pollzone-db`
- Choose the **Free** plan
- Click **Create Database**
- Copy the **Internal Database URL** (you'll need it next)

### 3. Deploy the Web Service
- Go to render.com → New → Web Service
- Connect your GitHub repo
- Fill in these settings:
  - **Name:** pollzone
  - **Runtime:** Node
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
  - **Plan:** Free

### 4. Add Environment Variables
In your Render web service → Environment tab, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste the Internal Database URL from step 2) |
| `ADMIN_KEY` | (make up a secret password) |
| `NODE_ENV` | `production` |

### 5. Deploy!
- Click **Create Web Service**
- Wait ~2 minutes for it to build
- Your site is live! 🎉

---

## 🔧 Updating the Poll of the Week

Send a PUT request to `/api/potw` with your admin key:

```bash
curl -X PUT https://your-site.onrender.com/api/potw \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Best superhero?",
    "option_a": "🦸 Spider-Man",
    "option_b": "🦇 Batman",
    "adminKey": "your_secret_admin_key_here"
  }'
```

Or use a tool like Postman / Insomnia if you prefer a UI.

---

## 📁 File Structure

```
pollzone/
├── server.js          ← Express backend + API routes
├── package.json       ← Dependencies
├── .env.example       ← Copy to .env for local dev
├── .gitignore
└── public/
    └── index.html     ← Frontend (served by Express)
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls` | Get all polls + vote counts |
| POST | `/api/vote` | Cast a vote `{ pollId, option: 'a'/'b' }` |
| GET | `/api/potw` | Get Poll of the Week |
| POST | `/api/potw/vote` | Vote on Poll of the Week `{ option: 'a'/'b' }` |
| PUT | `/api/potw` | Update Poll of the Week (admin only) |

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your DATABASE_URL

# Start dev server
npm run dev
```
