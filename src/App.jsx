import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";

const SAMPLE_TEXT = `Agents are systems that independently accomplish tasks on your behalf. A workflow is a system where LLMs and tools are orchestrated through predefined code paths. The distinction is useful because agents trade predictability for flexibility.`;

const DICTIONARY = {
  agents: ["智能体", "名词"], systems: ["系统", "名词"], independently: ["独立地", "副词"],
  accomplish: ["完成，实现", "动词"], tasks: ["任务", "名词"], behalf: ["代表；为了", "名词"],
  workflow: ["工作流", "名词"], tools: ["工具", "名词"], orchestrated: ["被编排、协调", "动词"],
  predefined: ["预先定义的", "形容词"], code: ["代码", "名词"], paths: ["路径", "名词"],
  distinction: ["区别，区分", "名词"], useful: ["有用的", "形容词"], trade: ["以……换取", "动词"],
  predictability: ["可预测性", "名词"], flexibility: ["灵活性", "名词"], through: ["通过", "介词"],
  where: ["在其中", "关系副词"], because: ["因为", "连词"], your: ["你的", "限定词"],
};

const SAMPLE_TRANSLATIONS = {
  "Agents are systems that independently accomplish tasks on your behalf.": "智能体是能够代表你独立完成任务的系统。",
  "A workflow is a system where LLMs and tools are orchestrated through predefined code paths.": "工作流是一种通过预定义代码路径来编排大语言模型与工具的系统。",
  "The distinction is useful because agents trade predictability for flexibility.": "这种区分很有用，因为智能体是以可预测性来换取灵活性的。",
};

const SENTENCE_NOTES = {
  "Agents are systems that independently accomplish tasks on your behalf.": {
    structure: "主句 Agents are systems + 定语从句 that independently accomplish tasks on your behalf",
    grammar: [
      { label: "定语从句", explanation: "that 指代 systems，并在从句中作主语，说明这些系统具有什么能力。" },
      { label: "固定搭配", explanation: "on your behalf 表示“代表你、为了你的利益”，常见于正式和商务英语。" },
    ],
  },
  "A workflow is a system where LLMs and tools are orchestrated through predefined code paths.": {
    structure: "主句 A workflow is a system + where 引导的定语从句",
    grammar: [
      { label: "关系副词 where", explanation: "where 相当于 in which，修饰 system，可理解为“在这个系统中”。" },
      { label: "被动语态", explanation: "are orchestrated 强调 LLM 和工具被代码路径组织，而不是强调谁来组织。" },
    ],
  },
  "The distinction is useful because agents trade predictability for flexibility.": {
    structure: "主句 The distinction is useful + because 原因状语从句",
    grammar: [
      { label: "原因状语从句", explanation: "because 后面给出“这种区分有用”的原因。" },
      { label: "trade A for B", explanation: "表示“牺牲或交出 A 来换取 B”，这里不是普通的“交易”。" },
    ],
  },
};

const electronApi = window.closeReadApi || null;
const api = electronApi || {
  analyze: async (payload) => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
};
const cleanWord = (value) => value.toLowerCase().replace(/[^a-z'-]/g, "");

function localAnalyze(text) {
  const rawSentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const sentences = rawSentences.map((part, index) => {
    const original = part.trim();
    const note = SENTENCE_NOTES[original];
    const words = (original.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || []).map((word) => {
      const key = cleanWord(word);
      const entry = DICTIONARY[key];
      return {
        word,
        lemma: key,
        pronunciation: "",
        partOfSpeech: entry?.[1] || "",
        meaning: entry?.[0] || "点击后可加入生词本；连接 AI 后生成语境释义",
        note: entry ? "当前语境中的含义" : "本地预览未收录该词",
        isKey: Boolean(entry),
      };
    });
    return {
      id: `sentence-${index + 1}`,
      original,
      translation: SAMPLE_TRANSLATIONS[original] || "连接 AI 后生成准确的整句翻译。",
      structure: note?.structure || "连接 AI 后按主干、从句和修饰成分拆解句子。",
      grammarPoints: note?.grammar || [{ label: "本地预览", explanation: "当前已完成分句和分词。配置 AI 后会补全这句话的语法分析。" }],
      words,
    };
  });
  return {
    title: "英文文档精读",
    summary: "先理解句子主干，再观察修饰关系，最后把重点词放回原句记忆。",
    sentences,
    mode: "local",
  };
}

const loadVocabulary = () => {
  try {
    return JSON.parse(localStorage.getItem("close-read-vocabulary") || "[]");
  } catch {
    return [];
  }
};

function IconButton({ label, children, className = "", ...props }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

export default function App() {
  const [view, setView] = useState("reader");
  const [source, setSource] = useState(SAMPLE_TEXT);
  const [analysis, setAnalysis] = useState(() => localAnalyze(SAMPLE_TEXT));
  const [activeSentence, setActiveSentence] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [vocabulary, setVocabulary] = useState(loadVocabulary);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [config, setConfig] = useState({ apiKey: "", model: "deepseek-chat" });
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("detailed");

  useEffect(() => {
    localStorage.setItem("close-read-vocabulary", JSON.stringify(vocabulary));
  }, [vocabulary]);

  const sentence = analysis?.sentences?.[activeSentence];
  const filteredVocabulary = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vocabulary.filter((item) => !query || `${item.word} ${item.meaning} ${item.sentence}`.toLowerCase().includes(query));
  }, [search, vocabulary]);

  const handleAnalyze = async () => {
    if (!source.trim()) {
      setMessage("请先粘贴英文内容。");
      return;
    }
    if (source.length > 8000) {
      setMessage("第一版建议每次不超过 8,000 个字符，可分段精读。");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      if (api && config.apiKey) {
        const result = await api.analyze({ text: source, level, apiKey: config.apiKey, model: config.model });
        if (!result.ok) throw new Error(result.error || "解析失败");
        setAnalysis({ ...result.analysis, mode: "ai" });
        setMessage("AI 精读解析已完成。");
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        setAnalysis(localAnalyze(source));
        setMessage(electronApi ? "当前使用本地预览。打开设置并填写 API Key，可获得完整翻译与语法解析。" : "本机 AI 代理已完成请求；如未填写 API Key，则继续使用本地预览。");
      }
      setActiveSentence(0);
      setSelectedWord(null);
      setView("reader");
    } catch (error) {
      setMessage(error.message || "解析失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const currentEntry = selectedWord && sentence ? {
    word: selectedWord.word,
    lemma: selectedWord.lemma,
    pronunciation: selectedWord.pronunciation,
    partOfSpeech: selectedWord.partOfSpeech,
    meaning: selectedWord.meaning,
    note: selectedWord.note,
    sentence: sentence.original,
    sentenceTranslation: sentence.translation,
  } : null;

  const isSaved = currentEntry && vocabulary.some((item) => item.lemma === currentEntry.lemma && item.sentence === currentEntry.sentence);

  const addVocabulary = () => {
    if (!currentEntry || isSaved) return;
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setVocabulary((items) => [{ ...currentEntry, id, mastered: false, createdAt: new Date().toISOString() }, ...items]);
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
  };

  const exportVocabulary = () => {
    const quote = (value) => `"${String(value || "").replaceAll('"', '""')}"`;
    const rows = [["word", "meaning", "part_of_speech", "sentence", "sentence_translation", "mastered"], ...vocabulary.map((item) => [item.word, item.meaning, item.partOfSpeech, item.sentence, item.sentenceTranslation, item.mastered ? "yes" : "no"])];
    const csv = `\uFEFF${rows.map((row) => row.map(quote).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "close-read-vocabulary.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sentenceCount = analysis?.sentences?.length || 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("reader")}>
          <span className="brand-mark"><BookOpen size={19} /></span>
          <span><strong>CloseRead</strong><small>英文技术文档精读</small></span>
        </button>
        <nav className={mobileNavOpen ? "nav-links open" : "nav-links"}>
          <button className={view === "reader" ? "active" : ""} onClick={() => { setView("reader"); setMobileNavOpen(false); }}><BookOpen size={17} />精读</button>
          <button className={view === "vocabulary" ? "active" : ""} onClick={() => { setView("vocabulary"); setMobileNavOpen(false); }}><Bookmark size={17} />生词本 <span className="count-badge">{vocabulary.length}</span></button>
        </nav>
        <div className="top-actions">
          <IconButton label="模型设置" onClick={() => setSettingsOpen(true)}><Settings size={19} /></IconButton>
          <IconButton label="打开导航" className="menu-button" onClick={() => setMobileNavOpen((value) => !value)}><Menu size={20} /></IconButton>
        </div>
      </header>

      {view === "reader" ? (
        <main className="reader-layout">
          <aside className="source-panel">
            <div className="panel-heading">
              <div><span className="step-label">01 · INPUT</span><h1>粘贴英文文档</h1></div>
              <button className="text-button" onClick={() => setSource(SAMPLE_TEXT)}>载入示例</button>
            </div>
            <textarea className="source-input" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Paste an English document here..." spellCheck="false" />
            <div className="input-meta"><span>{source.length.toLocaleString()} / 8,000 字符</span><span>{source.trim() ? source.trim().split(/\s+/).length : 0} 词</span></div>
            <div className="level-control" aria-label="讲解深度">
              {[['brief', '简明'], ['detailed', '详细'], ['technical', '技术英语']].map(([value, label]) => (
                <button key={value} className={level === value ? "active" : ""} onClick={() => setLevel(value)}>{label}</button>
              ))}
            </div>
            <button className="analyze-button" onClick={handleAnalyze} disabled={loading || !source.trim()}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}{loading ? "正在拆解文档…" : "开始精读"}
            </button>
            {message && <p className="message">{message}</p>}
            <div className="learning-order"><span>阅读顺序</span><ol><li>先读整句和译文</li><li>再看句子主干</li><li>最后点击生词</li></ol></div>
          </aside>

          <section className="study-panel">
            <div className="study-header">
              <div><span className="step-label">02 · CLOSE READING</span><h2>{analysis?.title || "逐句精读"}</h2><p>{analysis?.summary}</p></div>
              <div className="sentence-nav">
                <IconButton label="上一句" disabled={activeSentence === 0} onClick={() => { setActiveSentence((i) => i - 1); setSelectedWord(null); }}><ChevronLeft size={19} /></IconButton>
                <span>{sentenceCount ? activeSentence + 1 : 0} / {sentenceCount}</span>
                <IconButton label="下一句" disabled={activeSentence >= sentenceCount - 1} onClick={() => { setActiveSentence((i) => i + 1); setSelectedWord(null); }}><ChevronRight size={19} /></IconButton>
              </div>
            </div>

            {sentence ? (
              <div className="sentence-workspace">
                <article className="sentence-card">
                  <div className="sentence-index">SENTENCE {String(activeSentence + 1).padStart(2, "0")}</div>
                  <div className="english-line"><p>{sentence.original}</p><IconButton label="朗读本句" onClick={() => speak(sentence.original)}><Volume2 size={19} /></IconButton></div>
                  <div className="translation-block"><span>整句翻译</span><p className="translation">{sentence.translation || "模型未返回整句翻译，请重新解析。"}</p></div>
                  <div className="word-section-head"><span>逐词对照</span><small>点击任意词查看搭配与句中作用</small></div>
                  <div className="word-strip">
                    {sentence.words.map((word, index) => (
                      <button key={`${word.word}-${index}`} className={`word-token ${word.isKey ? "key" : ""} ${selectedWord === word ? "selected" : ""}`} onClick={() => setSelectedWord(word)}>
                        <strong>{word.word}</strong><span className="word-meaning">{word.meaning || "待补充语境释义"}</span><small>{[word.partOfSpeech, word.pronunciation].filter(Boolean).join(" · ")}</small>
                      </button>
                    ))}
                  </div>
                </article>

                <section className="analysis-section">
                  <div className="section-title"><span>句式骨架</span><small>先找主干，再看修饰</small></div>
                  <p className="structure-line">{sentence.structure}</p>
                  <div className="grammar-list">
                    {sentence.grammarPoints.map((point, index) => (
                      <div className="grammar-item" key={`${point.label}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{point.label}</h3><p>{point.explanation}</p></div></div>
                    ))}
                  </div>
                </section>
              </div>
            ) : <div className="empty-state"><BookOpen size={28} /><h3>从一小段开始</h3><p>粘贴 2–5 句英文，学习负担更轻。</p></div>}
          </section>

          <aside className={`word-panel ${selectedWord ? "has-word" : ""}`}>
            <span className="step-label">03 · WORD FOCUS</span>
            {currentEntry ? (
              <div className="word-detail">
                <div className="word-title-row"><div><h2>{currentEntry.word}</h2><p>{currentEntry.pronunciation || currentEntry.partOfSpeech || "语境词义"}</p></div><IconButton label="朗读单词" onClick={() => speak(currentEntry.word)}><Volume2 size={19} /></IconButton></div>
                <div className="meaning-block"><span>当前语境释义</span><strong>{currentEntry.meaning}</strong><p>{currentEntry.note}</p></div>
                <div className="context-block"><span>来自原文</span><p>{currentEntry.sentence}</p><small>{currentEntry.sentenceTranslation}</small></div>
                <button className={`save-word-button ${isSaved ? "saved" : ""}`} disabled={isSaved} onClick={addVocabulary}>{isSaved ? <BookmarkCheck size={18} /> : <Plus size={18} />}{isSaved ? "已加入生词本" : "加入生词本"}</button>
              </div>
            ) : (
              <div className="word-placeholder"><span>Aa</span><h3>点击句中的单词</h3><p>这里会显示这个词在当前句子里的具体含义，而不是罗列所有字典释义。</p></div>
            )}
          </aside>
        </main>
      ) : (
        <main className="vocabulary-view">
          <div className="vocabulary-header">
            <div><span className="step-label">VOCABULARY</span><h1>生词本</h1><p>每个词都保留它出现时的原句和语境释义。</p></div>
            <button className="secondary-button" onClick={exportVocabulary} disabled={!vocabulary.length}><Download size={17} />导出 CSV</button>
          </div>
          <div className="vocabulary-tools"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索单词、释义或原句" /><span>{filteredVocabulary.length} 个词</span></div>
          {filteredVocabulary.length ? (
            <div className="vocabulary-list">
              {filteredVocabulary.map((item) => (
                <article className={`vocab-card ${item.mastered ? "mastered" : ""}`} key={item.id}>
                  <div className="vocab-word"><div><h2>{item.word}</h2><span>{item.partOfSpeech} {item.pronunciation}</span></div><strong>{item.meaning}</strong></div>
                  <div className="vocab-context"><p>{item.sentence}</p><small>{item.sentenceTranslation}</small></div>
                  <div className="vocab-actions"><button onClick={() => setVocabulary((items) => items.map((entry) => entry.id === item.id ? { ...entry, mastered: !entry.mastered } : entry))}>{item.mastered ? <Bookmark size={16} /> : <Check size={16} />}{item.mastered ? "继续学习" : "标记已掌握"}</button><IconButton label="删除生词" onClick={() => setVocabulary((items) => items.filter((entry) => entry.id !== item.id))}><Trash2 size={17} /></IconButton></div>
                </article>
              ))}
            </div>
          ) : <div className="empty-state vocabulary-empty"><Bookmark size={28} /><h3>{search ? "没有匹配结果" : "还没有生词"}</h3><p>{search ? "换个关键词试试。" : "在精读页点击单词，并把它连同原句一起收藏。"}</p></div>}
        </main>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSettingsOpen(false)}>
          <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="modal-heading"><div><span className="step-label">AI SETTINGS</span><h2 id="settings-title">连接 AI 解析</h2></div><IconButton label="关闭设置" onClick={() => setSettingsOpen(false)}><X size={20} /></IconButton></div>
            <p className="settings-note">API Key 只发送给本机服务，并仅在本次运行中使用；不会写入生词本或浏览器存储。</p>
            {!electronApi && <div className="browser-notice">当前网页会通过本机开发服务代理 DeepSeek 请求，不会让浏览器直接访问模型接口。请保持终端里的 Vite 服务运行。</div>}
            <label className="field-label">DeepSeek API Key<input type="password" value={config.apiKey} onChange={(event) => setConfig((current) => ({ ...current, apiKey: event.target.value.trim() }))} placeholder="sk-..." autoComplete="off" /><small className="field-help">只粘贴 DeepSeek 控制台生成的完整 Key，不要粘贴“API Key：”等说明文字。</small></label>
            <label className="field-label">模型<input value={config.model} onChange={(event) => setConfig((current) => ({ ...current, model: event.target.value }))} placeholder="deepseek-chat" /></label>
            <button className="analyze-button" onClick={() => setSettingsOpen(false)}>保存本次设置</button>
          </section>
        </div>
      )}
    </div>
  );
}
