import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const CLOSE_READ_SCHEMA = {
  type: "object", additionalProperties: false, required: ["title", "summary", "sentences"], properties: {
    title: { type: "string" }, summary: { type: "string" }, sentences: { type: "array", items: {
      type: "object", additionalProperties: false, required: ["id", "original", "translation", "structure", "grammarPoints", "words"], properties: {
        id: { type: "string" }, original: { type: "string" }, translation: { type: "string" }, structure: { type: "string" },
        grammarPoints: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "explanation"], properties: { label: { type: "string" }, explanation: { type: "string" } } } },
        words: { type: "array", items: { type: "object", additionalProperties: false, required: ["word", "lemma", "pronunciation", "partOfSpeech", "meaning", "note", "isKey"], properties: {
          word: { type: "string" }, lemma: { type: "string" }, pronunciation: { type: "string" }, partOfSpeech: { type: "string" }, meaning: { type: "string" }, note: { type: "string" }, isKey: { type: "boolean" },
        } } },
      },
    } },
  },
};

const readBody = (request) => new Promise((resolve, reject) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    try { resolve(JSON.parse(body || "{}")); } catch { reject(new Error("请求内容不是有效 JSON。")); }
  });
  request.on("error", reject);
});

const parseModelJson = (content) => JSON.parse(String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
const buildInstructions = (level) => {
  const detail = { brief: "每句最多给出 2 个最重要的语法点。", detailed: "完整解释句子主干、从句、修饰关系和重要固定搭配。", technical: "特别解释软件、AI 和技术文档中的术语及常见表达。" }[level] || "完整解释句子结构。";
  return `你是一名面向中文母语学习者的英语精读老师。把用户文本按英文句子拆分，只输出一个 JSON 对象，不要输出 Markdown。要求：translation 是自然准确的中文整句翻译；structure 先给主干再连接从句、非谓语和介词短语；grammarPoints 用中文解释为什么这样理解；words 必须包含原句中每一个英文单词且保持原顺序，不含标点；lemma 用小写原形；pronunciation 使用 IPA；partOfSpeech、meaning、note 必须结合当前句子；isKey 只标记值得记忆的词。title 和 summary 用中文。${detail}\nJSON 字段结构必须为：{"title":"中文标题","summary":"中文阅读重点","sentences":[{"id":"sentence-1","original":"英文原句","translation":"中文翻译","structure":"句式骨架","grammarPoints":[{"label":"语法名称","explanation":"中文解释"}],"words":[{"word":"原词","lemma":"原形","pronunciation":"IPA","partOfSpeech":"词性","meaning":"当前语境释义","note":"搭配或句中作用","isKey":true}]}]}`;
};

const closeReadProxy = () => ({
  name: "close-read-proxy",
  configureServer(server) {
    server.middlewares.use("/api/analyze", async (request, response, next) => {
      if (request.method !== "POST") return next();
      try {
        const payload = await readBody(request);
        const text = String(payload.text || "").trim();
        const apiKey = String(payload.apiKey || "").trim();
        const model = String(payload.model || "deepseek-chat").trim();
        if (!text) throw new Error("请先粘贴英文内容。");
        if (text.length > 8000) throw new Error("单次文本不能超过 8,000 个字符。");
        if (!apiKey) throw new Error("请在设置中填写 DeepSeek API Key。");
        if (!/^sk-[\x21-\x7E]+$/.test(apiKey)) throw new Error("DeepSeek API Key 格式不正确。请只粘贴以 sk- 开头的 Key，不要包含中文说明、引号或空格。");
        const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: buildInstructions(payload.level) },
              { role: "user", content: text },
            ],
            response_format: { type: "json_object" },
            max_tokens: 8192,
            stream: false,
          }),
        });
        const data = await deepseekResponse.json();
        if (!deepseekResponse.ok) throw new Error(data?.error?.message || `请求失败（HTTP ${deepseekResponse.status}）`);
        const output = data?.choices?.[0]?.message?.content;
        if (!output) throw new Error("DeepSeek 没有返回可解析的内容。");
        const analysis = parseModelJson(output);
        if (!Array.isArray(analysis.sentences) || !analysis.sentences.length) throw new Error("DeepSeek 没有返回句子解析结果。");
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ ok: true, analysis }));
      } catch (error) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ ok: false, error: `AI 解析失败：${error.message || "未知错误"}` }));
      }
    });
  },
});

export default defineConfig({ plugins: [react(), closeReadProxy()], base: "./" });
