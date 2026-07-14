"use client";

import { useEffect, useRef, useState } from "react";

const SIZES = ["1024x1024", "1536x1024", "1024x1536", "auto"];
type Mode = "generate" | "edit";

export default function ImagePlayground({ model, baseUrl: defaultBase }: { model: string; baseUrl: string }) {
  const [mode, setMode] = useState<Mode>("generate");
  const [baseUrl, setBaseUrl] = useState(defaultBase || "https://code2alita.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [mdl, setMdl] = useState(model || "gpt-image-2");
  const [prompt, setPrompt] = useState("一只戴着宇航员头盔的柴犬，赛博朋克风格，霓虹灯光");
  const [size, setSize] = useState("1024x1024");
  // 图像编辑用：原图（公网 URL 或 base64）
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0); // 已用秒数（动态计时）
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 只有 URL 或 data: base64 才能直接预览。
  const canPreview = /^(https?:\/\/|data:image\/)/i.test(image.trim());

  const base = baseUrl.replace(/\/+$/, "");
  const endpoint = mode === "generate" ? "images/generations" : "images/edits";
  const actionText = mode === "generate" ? "生成图片" : "编辑图片";

  const run = async () => {
    setError("");
    setImg(null);
    if (!apiKey.trim()) return setError("请先填写 API Key");
    if (!prompt.trim()) return setError("请先填写提示词");
    if (mode === "edit" && !image.trim()) return setError("请先填写图片的公网 URL 或 base64");

    setLoading(true);
    setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed((Date.now() - start) / 1000), 100);

    try {
      let res: Response;
      if (mode === "generate") {
        res = await fetch("/api/playground/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseUrl, apiKey, model: mdl, prompt, size }),
        });
      } else {
        res = await fetch("/api/playground/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseUrl, apiKey, model: mdl, prompt, size, image: image.trim() }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "请求失败");
        return;
      }
      const first = data.images?.[0];
      if (!first) {
        setError("上游未返回图片");
        return;
      }
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
      {/* 模式切换 */}
      <div className="pg-tabs">
        <button className={`pg-tab ${mode === "generate" ? "active" : ""}`} onClick={() => setMode("generate")}>
          文生图
        </button>
        <button className={`pg-tab ${mode === "edit" ? "active" : ""}`} onClick={() => setMode("edit")}>
          图像编辑
        </button>
      </div>

      <div className="pg-grid">
        <div className="field">
          <label>Base URL</label>
          <input className="input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://code2alita.com/v1" />
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

        {mode === "edit" ? (
          <div className="field full">
            <label>原图（公网 URL 或 base64，必填）</label>
            <textarea
              className="textarea"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              rows={2}
              placeholder="https://example.com/cat.png 或 data:image/png;base64,xxxx"
            />
          </div>
        ) : null}

        <div className="field full">
          <label>提示词 Prompt</label>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        </div>
      </div>

      {mode === "edit" && canPreview ? (
        <div className="pg-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.trim()} alt="原图预览" />
          <span>原图预览</span>
        </div>
      ) : null}

      <div className="pg-actions">
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? `处理中… ${elapsed.toFixed(1)}s` : actionText}
        </button>
        <span className="pg-hint">调用 {base}/{endpoint}</span>
      </div>

      {error ? <div className="pg-error">⚠️ {error}</div> : null}

      <div className="pg-result">
        {loading ? (
          <div className="pg-skeleton">正在处理… 已用时 {elapsed.toFixed(1)} 秒</div>
        ) : img ? (
          <div className="pg-image-wrap">
            {/* 用户生成的临时预览图，使用原生 img 即可 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="结果" className="pg-image" />
            <a className="mini-btn" href={img} download="gpt-image.png" target="_blank" rel="noreferrer">
              下载图片
            </a>
          </div>
        ) : (
          <div className="pg-empty">结果图片将显示在这里</div>
        )}
      </div>
    </div>
  );
}
