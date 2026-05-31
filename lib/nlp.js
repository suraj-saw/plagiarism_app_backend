const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// English stopwords (same set as Python's NLTK stopwords.words('english'))
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
  'isn','ma','mightn','mustn','needn','shan','shouldn','wasn','weren','won','wouldn'
]);

function preprocessText(text) {
  // Tokenize (splits on whitespace/punctuation, keeps alphanumeric)
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];

  return tokens
    .filter(word => /^[a-z0-9]+$/.test(word))   // alphanumeric only
    .filter(word => !STOPWORDS.has(word))         // remove stopwords
    .map(word => stemmer.stem(word));             // porter stemmer
}

function getNgrams(tokens, n = 3) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

module.exports = { preprocessText, getNgrams };