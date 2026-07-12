"use client";

import { useEffect, useRef, useState } from "react";

const SIZES = ["1024x1024", "1536x1024", "1024x1536", "auto"];

export default function ImagePlayground({ model }: { model: string }) {
  const [baseUrl, setBaseUrl] = useState("https://code2alita.com");
  const [apiKey, setApiKey] = useState("");
  const [mdl, setMdl] = useState(model || "gpt-image-2");
  const [prompt, setPrompt] = useState("一只戴着宇航员头盔的柴犬，赛博朋克风格，霓虹灯光");
  const [size, setSize] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0); // 已用秒数（生成过程中动态计时）
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 组件卸载时清理计时器。
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const run = async () => {
    setError("");
    setImg(null);
    if (!apiKey.trim()) {
      setError("请先填写 API Key");
      return;
    }
    if (!prompt.trim()) {
      setError("请先填写提示词");
      return;
    }
    setLoading(true);
    // 启动计时：每 100ms 更新一次，保留一位小数。
    setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 100);
    try {
      const res = await fetch("/api/playground/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, model: mdl, prompt, size }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }
      const first = data.images?.[0];
      if (!first) {
        setError("上游未返回图片");
        return;
      }
      // 兼容返回 url 或 base64 两种形式。
      setImg(first.url ? first.url : `data:image/png;base64,${first.b64_json}`);
    } catch (e: any) {
      setError(e?.message || "网络错误");
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
    }
  };

  return (
    <div className="playground">
      <div className="pg-grid">
        <div className="field">
          <label>Base URL</label>
          <input className="input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://code2alita.com" />
        </div>
        <div className="field">
          <label>API Key</label>
          <input className="input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." autoComplete="off" />
        </div>
        <div className="field">
          <label>模型</label>
          <input className="input" value={mdl} onChange={(e) => setMdl(e.target.value)} placeholder="gpt-image-2" />
        </div>
        <div className="field">
          <label>尺寸</label>
          <select className="input" value={size} onChange={(e) => setSize(e.target.value)}>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>提示词 Prompt</label>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        </div>
      </div>

      <div className="pg-actions">
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? `生成中… ${elapsed.toFixed(1)}s` : "生成图片"}
        </button>
        <span className="pg-hint">调用 {baseUrl.replace(/\/+$/, "")}/v1/images/generations</span>
      </div>

      {error ? <div className="pg-error">⚠️ {error}</div> : null}

      <div className="pg-result">
        {loading ? (
          <div className="pg-skeleton">正在生成… 已用时 {elapsed.toFixed(1)} 秒</div>
        ) : img ? (
          <div className="pg-image-wrap">
            {/* 用户生成的临时预览图，使用原生 img 即可 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="生成结果" className="pg-image" />
            <a className="mini-btn" href={img} download="gpt-image.png" target="_blank" rel="noreferrer">
              下载图片
            </a>
          </div>
        ) : (
          <div className="pg-empty">生成的图片将显示在这里</div>
        )}
      </div>
    </div>
  );
}
