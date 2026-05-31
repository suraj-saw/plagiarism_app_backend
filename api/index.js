require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { preprocessText, getNgrams } = require('../lib/nlp');
const { KMPSearch } = require('../lib/kmp');
const { loadReferenceTexts } = require('../lib/supabase');

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-memory cache ─────────────────────────────────────────────────────────
let cachedReferenceTexts = null;
let cachedInvertedIndex = null;
let cacheError = null;

async function getIndexedData() {
  // Return cached error so we can report it clearly
  if (cacheError) throw cacheError;

  if (cachedReferenceTexts && cachedInvertedIndex) {
    return { referenceTexts: cachedReferenceTexts, invertedIndex: cachedInvertedIndex };
  }

  const rawTexts = await loadReferenceTexts();

  if (!rawTexts || rawTexts.length === 0) {
    throw new Error('No reference texts found in Supabase. Check your table name and RLS policies.');
  }

  const referenceTexts = rawTexts.map(row => ({
    filename: row.filename,
    processedText: preprocessText(row.content).join(' '),
    sourceUrl: row.source_url || 'No link available',
    snippet: row.content.substring(0, 500),
  }));

  const invertedIndex = new Map();
  for (const ref of referenceTexts) {
    const tokens = preprocessText(ref.processedText);
    const ngrams = getNgrams(tokens, 3);
    for (const ngram of ngrams) {
      if (!invertedIndex.has(ngram)) {
        invertedIndex.set(ngram, []);
      }
      invertedIndex.get(ngram).push(ref.filename);
    }
  }

  cachedReferenceTexts = referenceTexts;
  cachedInvertedIndex = invertedIndex;

  return { referenceTexts, invertedIndex };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    message: 'Plagiarism Detection API is running! (Node.js)',
    endpoints: {
      health: '/health (GET)',
      preprocess: '/preprocess (POST)',
      check_plagiarism: '/check_plagiarism (POST)',
    },
    status: 'active',
  });
});

// Health check — also validates Supabase connectivity
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    },
    supabase: 'untested',
    referenceTextsCount: 0,
  };

  try {
    const { referenceTexts } = await getIndexedData();
    checks.supabase = 'ok';
    checks.referenceTextsCount = referenceTexts.length;
    res.json(checks);
  } catch (err) {
    checks.supabase = 'error';
    checks.error = err.message;
    res.status(500).json(checks);
  }
});

app.post('/preprocess', (req, res) => {
  try {
    const { text = '' } = req.body;
    const processedText = preprocessText(text);
    res.json({ processed_text: processedText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/check_plagiarism', async (req, res) => {
  try {
    const { text = '' } = req.body;
    if (!text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { referenceTexts, invertedIndex } = await getIndexedData();

    const userTokens = preprocessText(text);
    const userNgrams = getNgrams(userTokens, 3);

    const matches = [];
    const checkedFiles = new Set();

    for (const userNgram of userNgrams) {
      if (invertedIndex.has(userNgram)) {
        const filenames = invertedIndex.get(userNgram);
        for (const filename of filenames) {
          if (checkedFiles.has(filename)) continue;

          const ref = referenceTexts.find(r => r.filename === filename);
          if (!ref) continue;

          const kmpMatches = KMPSearch(ref.processedText, userNgram);
          if (kmpMatches.length > 0) {
            matches.push({
              ngram: userNgram,
              reference_snippet: ref.snippet,
              link: ref.sourceUrl,
            });
          }
          checkedFiles.add(filename);
        }
      }
    }

    const matchedNgrams = new Set(matches.map(m => m.ngram));
    const plagiarismPercentage = userNgrams.length > 0
      ? (matchedNgrams.size / userNgrams.length) * 100
      : 0;

    res.json({
      plagiarism_detected: matches.length > 0,
      plagiarism_percentage: parseFloat(plagiarismPercentage.toFixed(2)),
      matches,
    });

  } catch (err) {
    console.error('Error in check_plagiarism:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ─── Export / local dev ───────────────────────────────────────────────────────
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}