#  Plagiarism Detection API

A fast, lightweight plagiarism detection REST API built with **Node.js** and **Express**. It uses **KMP string matching** and **trigram indexing** with **Porter stemming** to compare submitted text against a database of reference documents stored in **Supabase**.

Deployed on **Vercel** — no server management needed.

---

##  How It Works

```
User Text → Tokenize → Remove Stopwords → Porter Stem → Trigrams
                                                            ↓
                                               Inverted Index Lookup
                                                            ↓
                                               KMP String Match on Reference Texts
                                                            ↓
                                               Plagiarism % + Matched Sources
```

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Algorithm | KMP Search + Trigram Indexing |
| NLP | Porter Stemmer + Stopword Filtering |

---

##  Project Structure

```
plagiarism-api/
├── api/
│   └── index.js              # Express app + all routes
├── lib/
│   ├── kmp.js                # KMP string search algorithm
│   ├── nlp.js                # Tokenizer, stemmer, stopwords, ngrams
│   └── supabase.js           # Supabase REST client
├── supabase/
│   └── sample_reference_texts.sql   # Sample data to populate DB
├── .env                      # Your secrets (never commit this)
├── .gitignore
├── package.json
└── vercel.json
```

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or above
- A [Supabase](https://supabase.com/) account (free tier works)
- A [Vercel](https://vercel.com/) account (free tier works)

---

### Step 1 — Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and run the following to create the table:

```sql
CREATE TABLE reference_texts (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT
);
```

3. Then populate it with sample data. Copy the contents of `supabase/sample_reference_texts.sql` and run it in the SQL Editor.

4. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `anon public` key → this is your `SUPABASE_ANON_KEY`

---

### Step 2 — Clone & Install

```bash
git clone https://github.com/your-username/plagiarism-api.git
cd plagiarism-api
npm install
```

---

### Step 3 — Configure Environment Variables

Create a `.env` file in the root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

>  Never commit `.env` to GitHub. It is already listed in `.gitignore`.

---

### Step 4 — Run Locally

```bash
npm run dev
```

Server starts at `http://localhost:5000`

Test it:
```bash
curl http://localhost:5000/health
```

---

### Step 5 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add your environment variables:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Or add them manually in **Vercel Dashboard → Project → Settings → Environment Variables**.

---

##  API Endpoints

### `GET /`
Returns API status and available endpoints.

**Response:**
```json
{
  "message": "Plagiarism Detection API is running! (Node.js)",
  "endpoints": {
    "health": "/health (GET)",
    "preprocess": "/preprocess (POST)",
    "check_plagiarism": "/check_plagiarism (POST)"
  },
  "status": "active"
}
```

---

### `GET /health`
Checks server status and Supabase connectivity.

**Response:**
```json
{
  "server": "ok",
  "supabase": "ok",
  "referenceTextsCount": 12
}
```

---

### `POST /preprocess`
Returns the tokenized and stemmed version of input text. Useful for debugging.

**Request:**
```json
{
  "text": "Electric vehicles are becoming popular in India."
}
```

**Response:**
```json
{
  "processed_text": ["electr", "vehicl", "becom", "popular", "india"]
}
```

---

### `POST /check_plagiarism`
Main endpoint. Checks the submitted text against all reference documents.

**Request:**
```json
{
  "text": "Artificial intelligence is intelligence demonstrated by machines."
}
```

**Response:**
```json
{
  "plagiarism_detected": true,
  "plagiarism_percentage": 78.5,
  "matches": [
    {
      "ngram": "artifici intellig intellig",
      "reference_snippet": "Artificial intelligence (AI) is intelligence demonstrated by machines...",
      "link": "https://en.wikipedia.org/wiki/Artificial_intelligence"
    }
  ]
}
```

---

##  Adding Your Own Reference Texts

To add more documents for detection, run an `INSERT` in the Supabase SQL Editor:

```sql
INSERT INTO reference_texts (filename, content, source_url)
VALUES (
  'my_docs/my_article.txt',
  'Paste the full content of your reference document here.',
  'https://link-to-original-source.com'
);
```

The API caches reference texts in memory after the first load — **restart or redeploy** after adding new documents.

---

##  Environment Variables Reference

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public API key |
| `PORT` | Port for local dev (default: 5000) |

---

##  License

MIT — free to use, modify, and distribute.
