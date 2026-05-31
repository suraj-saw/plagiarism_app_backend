
function stem(word) {
  if (word.length <= 2) return word;

  word = step1a(word);
  word = step1b(word);
  word = step1c(word);
  word = step2(word);
  word = step3(word);
  word = step4(word);
  word = step5a(word);
  word = step5b(word);
  return word;
}

function hasSuffix(word, suffix) { return word.endsWith(suffix); }
function base(word, suffix) { return word.slice(0, word.length - suffix.length); }

// Count consonant-vowel sequences (m) in a stem
function measure(stem) {
  const re = /^[^aeiou]*([aeiou]+[^aeiou]+)+/;
  const m = stem.match(re);
  if (!m) return 0;
  return (stem.slice(0, m[0].length).match(/[aeiou]+[^aeiou]+/g) || []).length;
}

function containsVowel(stem) { return /[aeiou]/.test(stem); }
function doubleConsonant(word) {
  if (word.length < 2) return false;
  if (word[word.length - 1] !== word[word.length - 2]) return false;
  return !/[aeiou]/.test(word[word.length - 1]);
}
function cvc(word) {
  if (word.length < 3) return false;
  const c = word[word.length - 1], v = word[word.length - 2], c2 = word[word.length - 3];
  return !/[aeiou]/.test(c) && /[aeiou]/.test(v) && !/[aeiou]/.test(c2) && !/[wxy]/.test(c);
}

function step1a(w) {
  if (hasSuffix(w, 'sses')) return base(w, 'sses') + 'ss';
  if (hasSuffix(w, 'ies'))  return base(w, 'ies')  + 'i';
  if (hasSuffix(w, 'ss'))   return w;
  if (hasSuffix(w, 's'))    return base(w, 's');
  return w;
}

function step1b(w) {
  if (hasSuffix(w, 'eed')) { const b = base(w, 'eed'); if (measure(b) > 0) return b + 'ee'; return w; }
  if (hasSuffix(w, 'ed'))  { const b = base(w, 'ed');  if (containsVowel(b)) return step1b2(b); return w; }
  if (hasSuffix(w, 'ing')) { const b = base(w, 'ing'); if (containsVowel(b)) return step1b2(b); return w; }
  return w;
}
function step1b2(w) {
  if (hasSuffix(w, 'at') || hasSuffix(w, 'bl') || hasSuffix(w, 'iz')) return w + 'e';
  if (doubleConsonant(w) && !/[lsz]$/.test(w)) return w.slice(0, -1);
  if (measure(w) === 1 && cvc(w)) return w + 'e';
  return w;
}

function step1c(w) {
  if (hasSuffix(w, 'y') && containsVowel(base(w, 'y'))) return base(w, 'y') + 'i';
  return w;
}

const step2Map = [
  ['ational','ate'],['tional','tion'],['enci','ence'],['anci','ance'],
  ['izer','ize'],['bli','ble'],['alli','al'],['entli','ent'],['eli','e'],
  ['ousli','ous'],['ization','ize'],['ation','ate'],['ator','ate'],
  ['alism','al'],['iveness','ive'],['fulness','ful'],['ousness','ous'],
  ['aliti','al'],['iviti','ive'],['biliti','ble'],['logi','log'],
];
function step2(w) {
  for (const [suf, rep] of step2Map) {
    if (hasSuffix(w, suf)) { const b = base(w, suf); if (measure(b) > 0) return b + rep; }
  }
  return w;
}

const step3Map = [
  ['icate','ic'],['ative',''],['alize','al'],['iciti','ic'],
  ['ical','ic'],['ful',''],['ness',''],
];
function step3(w) {
  for (const [suf, rep] of step3Map) {
    if (hasSuffix(w, suf)) { const b = base(w, suf); if (measure(b) > 0) return b + rep; }
  }
  return w;
}

const step4List = ['al','ance','ence','er','ic','able','ible','ant','ement',
  'ment','ent','ion','ou','ism','ate','iti','ous','ive','ize'];
function step4(w) {
  for (const suf of step4List) {
    if (hasSuffix(w, suf)) {
      const b = base(w, suf);
      if (suf === 'ion') { if (measure(b) > 1 && /[st]$/.test(b)) return b; }
      else { if (measure(b) > 1) return b; }
    }
  }
  return w;
}

function step5a(w) {
  if (hasSuffix(w, 'e')) {
    const b = base(w, 'e');
    if (measure(b) > 1) return b;
    if (measure(b) === 1 && !cvc(b)) return b;
  }
  return w;
}
function step5b(w) {
  if (measure(w) > 1 && doubleConsonant(w) && hasSuffix(w, 'l')) return w.slice(0, -1);
  return w;
}

// ─── Tokenizer ───────────────────────────────────────────────────────────────
function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []);
}

// ─── Stopwords (same set as NLTK English) ────────────────────────────────────
const STOPWORDS = new Set([
  'i','me','my','myself','we','our','ours','ourselves','you','your','yours',
  'yourself','yourselves','he','him','his','himself','she','her','hers',
  'herself','it','its','itself','they','them','their','theirs','themselves',
  'what','which','who','whom','this','that','these','those','am','is','are',
  'was','were','be','been','being','have','has','had','having','do','does',
  'did','doing','a','an','the','and','but','if','or','because','as','until',
  'while','of','at','by','for','with','about','against','between','into',
  'through','during','before','after','above','below','to','from','up','down',
  'in','out','on','off','over','under','again','further','then','once','here',
  'there','when','where','why','how','all','both','each','few','more','most',
  'other','some','such','no','nor','not','only','own','same','so','than','too',
  'very','s','t','can','will','just','don','should','now','d','ll','m','o',
  're','ve','y','ain','aren','couldn','didn','doesn','hadn','hasn','haven',
  'isn','ma','mightn','mustn','needn','shan','shouldn','wasn','weren','won','wouldn',
]);

// ─── Public API ──────────────────────────────────────────────────────────────
function preprocessText(text) {
  return tokenize(text)
    .filter(w => /^[a-z0-9]+$/.test(w))
    .filter(w => !STOPWORDS.has(w))
    .map(w => stem(w));
}

function getNgrams(tokens, n = 3) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

module.exports = { preprocessText, getNgrams };
