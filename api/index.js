require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { preprocessText, getNgrams } = require('../lib/nlp');
const { KMPSearch } = require('../lib/kmp');
const { loadReferenceTexts } = require('../lib/supabase');

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-memory cache ────────────────────────────────────────────────────────
// On serverless (Vercel), cold starts re-fetch from Supabase automatically.
// On a warm instance, the cache avoids redundant DB calls.
let cachedReferenceTexts = null;
let cachedInvertedIndex = null;

async function getIndexedData() {
  if (cachedReferenceTexts && cachedInvertedIndex) {
    return { referenceTexts: cachedReferenceTexts, invertedIndex: cachedInvertedIndex };
  }

  const rawTexts = await loadReferenceTexts();

  // Preprocess each reference text
  const referenceTexts = rawTexts.map(row => ({
    filename: row.filename,
    processedText: preprocessText(row.content).join(' '),
    sourceUrl: row.source_url || 'No link available',
    snippet: row.content.substring(0, 500),  // raw snippet for display
  }));

  // Build inverted index (ngram → list of filenames)
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


app.get('/', (req, res) => {
  res.json({
    message: 'Plagiarism Detection API is running! (Node.js)',
    endpoints: {
      preprocess: '/preprocess (POST)',
      check_plagiarism: '/check_plagiarism (POST)',
    },
    status: 'active',
  });
});

app.post('/preprocess', (req, res) => {
  const { text = '' } = req.body;
  const processedText = preprocessText(text);
  res.json({ processed_text: processedText });
});

app.post('/check_plagiarism', async (req, res) => {
  try {
    const { text = '' } = req.body;
    if (!text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { referenceTexts, invertedIndex } = await getIndexedData();

    // Preprocess user text
    const userTokens = preprocessText(text);
    const userNgrams = getNgrams(userTokens, 3);

    const matches = [];
    const checkedFiles = new Set();

    // For each user ngram, check inverted index then run KMP
    for (const userNgram of userNgrams) {
      if (invertedIndex.has(userNgram)) {
        const filenames = invertedIndex.get(userNgram);
        for (const filename of filenames) {
          if (checkedFiles.has(filename)) continue;

          // Find this reference's full processed text
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

    // ── Improved plagiarism % calculation ──────────────────────────────────
    // Count unique matched ngrams vs total user ngrams (much more accurate
    // than the original snippet-length approach in your Flask server)
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

// Vercel exports the app as a handler
module.exports = app;

// Local dev server
if (require.main === module) {
  app.listen(5000, () => console.log('Server running on http://localhost:5000'));
}