const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);


async function loadReferenceTexts() {
  const { data, error } = await supabase
    .from('reference_texts')
    .select('filename, content, source_url');

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error('Failed to load reference texts');
  }
  return data;
}

module.exports = { loadReferenceTexts };