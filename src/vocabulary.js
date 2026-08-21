const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formFromEntry = (entry) => ({
  word: entry.word || entry.displayWord || entry.lemma || "",
  partOfSpeech: entry.partOfSpeech || "",
  pronunciation: entry.pronunciation || "",
  meaning: entry.meaning || "",
  note: entry.note || "",
});

const contextFromEntry = (entry) => ({
  sentence: entry.sentence || "",
  sentenceTranslation: entry.sentenceTranslation || "",
  word: entry.word || entry.displayWord || entry.lemma || "",
  partOfSpeech: entry.partOfSpeech || "",
  meaning: entry.meaning || "",
  note: entry.note || "",
});

const formKey = (form) => [form.word, form.partOfSpeech, form.meaning].map(normalize).join("|");
const contextKey = (context) => [context.sentence, context.word, context.meaning].map(normalize).join("|");

const uniqueBy = (items, keyFor) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const toVocabularyEntry = (entry) => {
  const lemma = normalize(entry.lemma || entry.word || entry.displayWord);
  const now = new Date().toISOString();
  return {
    id: entry.id || makeId(),
    lemma,
    displayWord: entry.displayWord || entry.word || lemma,
    familyLemma: normalize(entry.familyLemma || lemma),
    mastered: Boolean(entry.mastered),
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
    forms: uniqueBy(
      Array.isArray(entry.forms) && entry.forms.length ? entry.forms : [formFromEntry(entry)],
      formKey,
    ),
    contexts: uniqueBy(
      Array.isArray(entry.contexts) && entry.contexts.length ? entry.contexts : [contextFromEntry(entry)],
      contextKey,
    ).filter((context) => context.sentence),
  };
};

export const mergeVocabularyEntry = (existing, incoming) => {
  const current = toVocabularyEntry(existing);
  const addition = toVocabularyEntry(incoming);
  return {
    ...current,
    displayWord: current.displayWord || addition.displayWord,
    familyLemma: addition.familyLemma || current.familyLemma,
    updatedAt: new Date().toISOString(),
    forms: uniqueBy([...current.forms, ...addition.forms], formKey),
    contexts: uniqueBy([...current.contexts, ...addition.contexts], contextKey),
  };
};

export const normalizeVocabulary = (records) => {
  if (!Array.isArray(records)) return [];
  const grouped = new Map();
  records.forEach((record) => {
    const entry = toVocabularyEntry(record || {});
    if (!entry.lemma) return;
    grouped.set(entry.lemma, grouped.has(entry.lemma) ? mergeVocabularyEntry(grouped.get(entry.lemma), entry) : entry);
  });
  return [...grouped.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
};

export const addToVocabulary = (records, incoming) => {
  const normalized = normalizeVocabulary(records);
  const entry = toVocabularyEntry(incoming);
  const index = normalized.findIndex((item) => item.lemma === entry.lemma);
  if (index === -1) return [entry, ...normalized];
  const merged = mergeVocabularyEntry(normalized[index], entry);
  return [merged, ...normalized.filter((_, itemIndex) => itemIndex !== index)];
};

export const hasVocabularyContext = (records, incoming) => {
  const lemma = normalize(incoming?.lemma || incoming?.word);
  const key = contextKey(contextFromEntry(incoming || {}));
  return records.some((record) => record.lemma === lemma && record.contexts.some((context) => contextKey(context) === key));
};

export const vocabularySearchText = (entry) => [
  entry.lemma,
  entry.displayWord,
  entry.familyLemma,
  ...entry.forms.flatMap((form) => [form.word, form.partOfSpeech, form.meaning, form.note]),
  ...entry.contexts.flatMap((context) => [context.sentence, context.sentenceTranslation, context.meaning, context.note]),
].join(" ").toLowerCase();

