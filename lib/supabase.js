const https = require('https');

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function loadReferenceTexts() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  const endpoint = `${url}/rest/v1/reference_texts?select=filename,content,source_url`;

  const { status, body } = await httpsGet(endpoint, {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  });

  if (status !== 200) {
    throw new Error(`Supabase REST error [${status}]: ${JSON.stringify(body)}`);
  }

  if (!Array.isArray(body) || body.length === 0) {
    throw new Error(
      `Supabase returned ${Array.isArray(body) ? 0 : 'non-array'} rows. ` +
      `Check table name "reference_texts", RLS policies, and that data exists. ` +
      `Raw: ${JSON.stringify(body).slice(0, 200)}`
    );
  }

  return body;
}

module.exports = { loadReferenceTexts };