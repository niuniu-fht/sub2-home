"use client";

import { useMemo, useState } from "react";
import type { Model } from "@/lib/types";

// 根据厂商名生成稳定的头像配色。
const PALETTE: [string, string][] = [
  ["#10a37f", "#0d8a6a"],
  ["#d97757", "#c25f3d"],
  ["#4285f4", "#3367d6"],
  ["#7c6cff", "#6a5bff"],
  ["#ff6b35", "#e85a2a"],
  ["#22d3ee", "#0ea5c4"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#db2777"],
];
function colorFor(key: string): [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export default function ModelPlaza({ models }: { models: Model[] }) {
  const [q, setQ] = useState("");
  const [provider, setProvider] = useState<string>("全部");
  const [copied, setCopied] = useState<string | null>(null);

  const providers = useMemo(
    () => ["全部", ...Array.from(new Set(models.map((m) => m.provider)))],
    [models]
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return models.filter((m) => {
      const okProvider = provider === "全部" || m.provider === provider;
      const okKw =
        !kw ||
        m.name.toLowerCase().includes(kw) ||
        m.id.toLowerCase().includes(kw) ||
        m.provider.toLowerCase().includes(kw) ||
        m.tags.some((t) => t.toLowerCase().includes(kw));
      return okProvider && okKw;
    });
  }, [models, q, provider]);

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };

  return (
    <section className="section" id="models">
      <div className="container">
        <div className="section-head">
          <h2>模型广场</h2>
          <p>当前支持的模型，点击卡片即可复制模型 ID 用于调用</p>
        </div>

        <div className="toolbar">
          <input
            className="search"
            placeholder="搜索模型名称、ID 或标签…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="filters">
            {providers.map((p) => (
              <button
                key={p}
                className={`chip ${provider === p ? "active" : ""}`}
                onClick={() => setProvider(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">没有匹配的模型</div>
        ) : (
          <div className="grid">
            {filtered.map((m) => {
              const [c1, c2] = colorFor(m.provider);
              return (
                <div key={m.id} className="model-card" onClick={() => copy(m.id)}>
                  <button className="mc-copy" onClick={(e) => { e.stopPropagation(); copy(m.id); }}>
                    {copied === m.id ? "已复制 ✓" : "复制 ID"}
                  </button>
                  <div className="mc-top">
                    <div
                      className="mc-avatar"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      {m.provider.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="mc-name">{m.name}</div>
                      <div className="mc-provider">{m.provider}</div>
                    </div>
                  </div>
                  <div className="mc-desc">{m.description}</div>
                  {m.pricing && (m.pricing.size1k || m.pricing.size2k || m.pricing.size4k) ? (
                    <div className="mc-price">
                      {(
                        [
                          ["1K", m.pricing.size1k],
                          ["2K", m.pricing.size2k],
                          ["4K", m.pricing.size4k],
                        ] as const
                      )
                        .filter(([, v]) => v)
                        .map(([label, v]) => (
                          <div key={label} className="price-item">
                            <span className="pl">{label}</span>
                            <span className="pv">{v}</span>
                          </div>
                        ))}
                    </div>
                  ) : null}
                  <div className="mc-foot">
                    <div className="mc-tags">
                      {m.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                    {m.context && m.context !== "-" ? <span className="mc-ctx">{m.context}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
