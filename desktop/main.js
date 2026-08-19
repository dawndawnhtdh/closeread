import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseModelJson = (content) => JSON.parse(
  String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
);

const buildInstructions = (level) => {
  const detail = {
    brief: "每句最多给出 2 个最重要的语法点。",
    detailed: "完整解释句子主干、从句、修饰关系和重要固定搭配。",
    technical: "特别解释软件、AI 和技术文档中的术语及常见表达。",
  }[level] || "完整解释句子结构。";

  return `你是一名面向中文母语学习者的英语精读老师。把用户文本按英文句子拆分，只输出一个 JSON 对象，不要输出 Markdown。要求：translation 是自然准确的中文整句翻译；structure 先给主干再连接从句、非谓语和介词短语；grammarPoints 用中文解释为什么这样理解；words 必须包含原句中每一个英文单词且保持原顺序，不含标点；lemma 用小写原形；pronunciation 使用 IPA；partOfSpeech、meaning、note 必须结合当前句子；isKey 只标记值得记忆的词。title 和 summary 用中文。${detail}\nJSON 字段结构必须为：{"title":"中文标题","summary":"中文阅读重点","sentences":[{"id":"sentence-1","original":"英文原句","translation":"中文翻译","structure":"句式骨架","grammarPoints":[{"label":"语法名称","explanation":"中文解释"}],"words":[{"word":"原词","lemma":"原形","pronunciation":"IPA","partOfSpeech":"词性","meaning":"当前语境释义","note":"搭配或句中作用","isKey":true}]}]}`;
};

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 700,
    title: "CloseRead",
    backgroundColor: "#f4f3ef",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
};

ipcMain.handle("close-read:analyze", async (_event, payload) => {
  const text = String(payload?.text || "").trim();
  const apiKey = String(payload?.apiKey || "").trim();
  const model = String(payload?.model || "deepseek-chat").trim();
  const level = ["brief", "detailed", "technical"].includes(payload?.level) ? payload.level : "detailed";

  if (!text) return { ok: false, error: "请先粘贴英文内容。" };
  if (text.length > 8000) return { ok: false, error: "单次文本不能超过 8,000 个字符。" };
  if (!apiKey) return { ok: false, error: "请在设置中填写 DeepSeek API Key。" };
  if (!/^sk-[\x21-\x7E]+$/.test(apiKey)) return { ok: false, error: "DeepSeek API Key 格式不正确。" };

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildInstructions(level) },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        max_tokens: 8192,
        stream: false,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `请求失败（HTTP ${response.status}）`);
    const analysis = parseModelJson(data?.choices?.[0]?.message?.content);
    if (!Array.isArray(analysis.sentences) || !analysis.sentences.length) throw new Error("DeepSeek 没有返回句子解析结果。");
    return { ok: true, analysis };
  } catch (error) {
    return { ok: false, error: `AI 解析失败：${error.message || "未知错误"}` };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
