"use client";

import { useEffect, useState } from "react";
import type { Config, Model } from "@/lib/types";

const EMPTY_MODEL: Model = {
  id: "",
  name: "",
  provider: "",
  description: "",
  context: "",
  tags: [],
  pricing: { size1k: "", size2k: "", size4k: "" },
  enabled: true,
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [config, setConfig] = useState<Config | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  // 修改密码表单
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  // 尝试拉取配置：若 401 说明未登录。
  const load = async () => {
    const res = await fetch("/api/admin/config", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = (await res.json()) as Config;
    setConfig(data);
    setAuthed(true);
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginErr("密码错误，请重试");
      return;
    }
    setPassword("");
    await load();
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setConfig(null);
    setAuthed(false);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    if (res.ok) {
      flash("ok", "保存成功，首页已更新");
    } else {
      const data = await res.json().catch(() => ({}));
      flash("err", data.error || "保存失败");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) {
      flash("err", "两次输入的新密码不一致");
      return;
    }
    setPwdSaving(true);
    const res = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
    });
    setPwdSaving(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPwd({ current: "", next: "", confirm: "" });
      flash("ok", "密码已修改，下次登录请用新密码");
    } else {
      flash("err", data.error || "修改失败");
    }
  };

  // ---- 站点字段更新 ----
  const setSite = (key: keyof Config["site"], value: string) => {
    if (!config) return;
    setConfig({ ...config, site: { ...config.site, [key]: value } });
  };

  // ---- 模型操作 ----
  const setModel = (idx: number, patch: Partial<Model>) => {
    if (!config) return;
    const models = config.models.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    setConfig({ ...config, models });
  };
  const addModel = () => {
    if (!config) return;
    setConfig({ ...config, models: [{ ...EMPTY_MODEL }, ...config.models] });
  };
  const removeModel = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, models: config.models.filter((_, i) => i !== idx) });
  };
  const move = (idx: number, dir: -1 | 1) => {
    if (!config) return;
    const j = idx + dir;
    if (j < 0 || j >= config.models.length) return;
    const models = [...config.models];
    [models[idx], models[j]] = [models[j], models[idx]];
    setConfig({ ...config, models });
  };

  if (authed === null) {
    return <div className="admin-wrap">加载中…</div>;
  }

  if (!authed) {
    return (
      <div className="login-box">
        <h1>后台登录</h1>
        <p>请输入管理员密码以编辑模型广场</p>
        <form onSubmit={login}>
          <div className="field">
            <input
              className="input"
              type="password"
              placeholder="管理员密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {loginErr ? <div className="toast err" style={{ marginBottom: 14 }}>{loginErr}</div> : null}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            登录
          </button>
        </form>
      </div>
    );
  }

  if (!config) return <div className="admin-wrap">加载中…</div>;

  return (
    <div className="admin-wrap">
      <div className="admin-head">
        <h1>后台管理</h1>
        <div className="mr-actions">
          <a className="mini-btn" href="/" target="_blank">
            查看首页 ↗
          </a>
          <button className="mini-btn" onClick={logout}>
            退出登录
          </button>
        </div>
      </div>

      {/* 站点与 API 配置 */}
      <div className="panel">
        <h2>站点信息 & API 地址</h2>
        <div className="form-grid">
          <div className="field">
            <label>站点标题</label>
            <input className="input" value={config.site.title} onChange={(e) => setSite("title", e.target.value)} />
          </div>
          <div className="field">
            <label>副标题（用 · 分隔上下两行）</label>
            <input className="input" value={config.site.subtitle} onChange={(e) => setSite("subtitle", e.target.value)} />
          </div>
          <div className="field full">
            <label>首页描述</label>
            <textarea className="textarea" value={config.site.description} onChange={(e) => setSite("description", e.target.value)} />
          </div>
          <div className="field">
            <label>API 地址（跳转目标 sub2api）</label>
            <input className="input" value={config.site.apiUrl} onChange={(e) => setSite("apiUrl", e.target.value)} placeholder="https://api.example.com" />
          </div>
          <div className="field">
            <label>跳转按钮文字</label>
            <input className="input" value={config.site.apiButtonText} onChange={(e) => setSite("apiButtonText", e.target.value)} />
          </div>
          <div className="field full">
            <label>文档地址（可选）</label>
            <input className="input" value={config.site.docsUrl} onChange={(e) => setSite("docsUrl", e.target.value)} placeholder="https://api.example.com/docs" />
          </div>
          <div className="field">
            <label>在线生图平台地址（留空则不显示按钮）</label>
            <input className="input" value={config.site.imageUrl} onChange={(e) => setSite("imageUrl", e.target.value)} placeholder="https://image.code2alita.com" />
          </div>
          <div className="field">
            <label>生图平台按钮文字</label>
            <input className="input" value={config.site.imageButtonText} onChange={(e) => setSite("imageButtonText", e.target.value)} placeholder="进入在线生图平台" />
          </div>
          <div className="field full">
            <label>API 控制台打开方式</label>
            <label className="switch" style={{ marginTop: 4 }}>
              <input
                type="checkbox"
                checked={config.site.apiOpenInNewTab !== false}
                onChange={(e) =>
                  setConfig({ ...config, site: { ...config.site, apiOpenInNewTab: e.target.checked } })
                }
              />
              {config.site.apiOpenInNewTab !== false ? "新窗口打开（新标签页）" : "当前页面打开"}
            </label>
          </div>
        </div>
      </div>

      {/* 模型列表 */}
      <div className="panel">
        <div className="admin-head" style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, border: "none", padding: 0 }}>模型广场（{config.models.length}）</h2>
          <button className="mini-btn" onClick={addModel}>+ 新增模型</button>
        </div>

        {config.models.map((m, idx) => (
          <div key={idx} className={`model-row ${m.enabled ? "" : "disabled"}`}>
            <div className="mr-head">
              <div className="mr-title">{m.name || m.id || "（未命名模型）"}</div>
              <div className="mr-actions">
                <label className="switch">
                  <input type="checkbox" checked={m.enabled} onChange={(e) => setModel(idx, { enabled: e.target.checked })} />
                  显示
                </label>
                <button className="mini-btn" onClick={() => move(idx, -1)} title="上移">↑</button>
                <button className="mini-btn" onClick={() => move(idx, 1)} title="下移">↓</button>
                <button className="mini-btn danger" onClick={() => removeModel(idx)}>删除</button>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>模型 ID（调用名）</label>
                <input className="input" value={m.id} onChange={(e) => setModel(idx, { id: e.target.value })} placeholder="gpt-4o" />
              </div>
              <div className="field">
                <label>显示名称</label>
                <input className="input" value={m.name} onChange={(e) => setModel(idx, { name: e.target.value })} placeholder="GPT-4o" />
              </div>
              <div className="field">
                <label>厂商</label>
                <input className="input" value={m.provider} onChange={(e) => setModel(idx, { provider: e.target.value })} placeholder="OpenAI" />
              </div>
              <div className="field">
                <label>上下文长度</label>
                <input className="input" value={m.context} onChange={(e) => setModel(idx, { context: e.target.value })} placeholder="128K" />
              </div>
              <div className="field full">
                <label>描述</label>
                <textarea className="textarea" value={m.description} onChange={(e) => setModel(idx, { description: e.target.value })} />
              </div>
              <div className="field full">
                <label>标签（英文逗号分隔）</label>
                <input
                  className="input"
                  value={m.tags.join(", ")}
                  onChange={(e) => setModel(idx, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="对话, 视觉, 推荐"
                />
              </div>
              <div className="field full">
                <label>价格（1K / 2K / 4K，留空则不展示）</label>
                <div className="price-grid">
                  <input
                    className="input"
                    value={m.pricing?.size1k ?? ""}
                    onChange={(e) => setModel(idx, { pricing: { ...m.pricing, size1k: e.target.value } })}
                    placeholder="1K 价格，如 $0.02 / 张"
                  />
                  <input
                    className="input"
                    value={m.pricing?.size2k ?? ""}
                    onChange={(e) => setModel(idx, { pricing: { ...m.pricing, size2k: e.target.value } })}
                    placeholder="2K 价格"
                  />
                  <input
                    className="input"
                    value={m.pricing?.size4k ?? ""}
                    onChange={(e) => setModel(idx, { pricing: { ...m.pricing, size4k: e.target.value } })}
                    placeholder="4K 价格"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 修改管理员密码 */}
      <div className="panel">
        <h2>修改管理员密码</h2>
        <form onSubmit={changePassword}>
          <div className="form-grid">
            <div className="field">
              <label>当前密码</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              />
            </div>
            <div className="field" />
            <div className="field">
              <label>新密码（至少 6 位）</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
            </div>
            <div className="field">
              <label>确认新密码</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              />
            </div>
          </div>
          <button className="mini-btn" style={{ marginTop: 6 }} disabled={pwdSaving}>
            {pwdSaving ? "修改中…" : "修改密码"}
          </button>
        </form>
      </div>

      <div className="bar">
        {toast ? <span className={`toast ${toast.type}`}>{toast.msg}</span> : null}
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "保存中…" : "保存全部修改"}
        </button>
      </div>
    </div>
  );
}
