"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { sanitizeInput, sanitizeHtml } from "@/lib/sanitize";

// ─── Writeup manifest ─────────────────────────────────────────────────────────
// Drop a new .html file into /public/writeups/ and add an entry here.
const WRITEUPS = [
  {
    id: "path-traversal",
    title: "Forge of Jotunheim: LFI via /proc/self/environ",
    slug: "redfoxCTF-2026/path-traversal-writeup.html",
    category: "Web · Path Traversal",
    difficulty: "EASY",
    tags: ["lfi", "proc", "wsgi", "python"],
    summary:
      "No path sanitization + absolute paths + /proc/self/environ = flag leaked from environment variables.",
  },
  {
    id: "sqli",
    title: "Archives of Alfheim: SQLite UNION-Based SQLi",
    slug: "redfoxCTF-2026/sqli-writeup.html",
    category: "Web · SQL Injection",
    difficulty: "MEDIUM",
    tags: ["sqli", "sqlite", "sqlite_master", "union"],
    summary:
      "Wrong DB engine assumption, a key error message, and sqlite_master led to dumping the sealed_tablets table.",
  },
  {
    id: "jwt-kid",
    title: "Midgard Gate: JWT kid Path Traversal",
    slug: "redfoxCTF-2026/jwt-kid-writeup.html",
    category: "Web · Auth Bypass",
    difficulty: "MEDIUM",
    tags: ["jwt", "kid", "hmac", "alg-confusion"],
    summary:
      "kid parameter used as a file path — pointed to /dev/null, signed with empty secret, escalated role to einherjar.",
  },
  {
    id: "api-key",
    title: "Realm's Hidden Keys: Exposed API Key in S3 JS",
    slug: "redfoxCTF-2026/api-key-exposure-writeup.html",
    category: "Web · API Security",
    difficulty: "EASY",
    tags: ["api-key", "s3", "client-side", "aws"],
    summary:
      "Hardcoded API key in S3-hosted JavaScript. Troll flag on /v2/, real flag on the forgotten /v1/ endpoint.",
  },
  {
    id: "iam",
    title: "Halls of Asgard: AWS IAM Enumeration",
    slug: "redfoxCTF-2026/iam-enumeration-writeup.html",
    category: "Cloud · AWS",
    difficulty: "MEDIUM",
    tags: ["aws", "iam", "s3", "policy-versions"],
    summary:
      "Leaked credentials → group inheritance → S3 bucket name in policy doc → flag in stale policy Resource ARN.",
  },
  {
    id: "3d-obj",
    title: "The NewAge: Hex File to 3D OBJ",
    slug: "redfoxCTF-2026/3d-obj-writeup.html",
    category: "Forensics · Steganography",
    difficulty: "EASY",
    tags: ["forensics", "hex", "obj", "tinkercad"],
    summary:
      "65536-char ASCII file → hex decode → Tinkercad OBJ export → 3D viewer reveals a golfer figure beside the flag.",
  },
];

// ─── Filesystem ───────────────────────────────────────────────────────────────
const fs = {
  "/": {
    type: "dir" as const,
    children: {
      "about.txt": {
        type: "file" as const,
        content:
          "Hi, I'm Bagadi Bharat — a web developer, penetration tester, and CTF competitor. I specialize in full-stack development, web application security, and network exploitation.\nI enjoy building scalable applications, breaking systems to understand how they work, and helping organizations strengthen their security. Outside of work, I write walkthroughs, explore new tools, and participate in hackathons.",
      },
      "resume.pdf": {
        type: "file" as const,
        url: "/assets/Bagadi_Bharat_Resume.pdf",
        downloadable: true,
      },
      projects: {
        type: "dir" as const,
        children: {
          PulseView: {
            type: "dir" as const,
            children: {
              "info.txt": {
                type: "file" as const,
                content:
                  '<p><strong>Project:</strong> PulseView 2 - REST API Monitoring Browser Extension</p>\n<p><strong>Description:</strong></p>\n<ul><li>Developed a browser extension to capture and display live POST, PUT, and GET requests made by active browser tabs.</li><li>Implemented dynamic visualization of API traffic using interactive graphs for better analysis and debugging.</li><li>Enhanced developer productivity by providing real-time monitoring of REST requests within a single browser window.</li></ul><p><strong>Link:</strong> <a href="https://github.com/thebharat07/PulseView" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>\n',
              },
            },
          },
        },
      },
      writeups: {
        type: "dir" as const,
        children: Object.fromEntries(
          WRITEUPS.map((w) => [
            w.slug,
            {
              type: "file" as const,
              url: `/writeups/${w.slug}`,
              downloadable: false,
              _writeupId: w.id,
            },
          ]),
        ),
      },
      tools: {
        type: "dir" as const,
        children: {
          "tools.txt": {
            type: "file" as const,
            content:
              "Tools & Resources\n<strong>Languages</strong><div>Java, Python, C, JavaScript, Assembly (beginner)</div>\n<strong>Frameworks</strong><div>React, Next.js, Spring Boot, Django, Flask, Express</div>\n<strong>Databases</strong><div>MySQL, PostgreSQL, MongoDB</div>\n<strong>Pentesting</strong><div>nmap, nikto, gobuster, Burp Suite, Wireshark, Metasploit</div>\n<strong>RE / Debug</strong><div>gdb, basic assembly debugging</div>\n<strong>OS</strong><div>Windows, Kali Linux, Arch Linux, Ubuntu</div>\n",
          },
        },
      },
      certificates: {
        type: "dir" as const,
        children: {
          "Introduction_to_cybersecurity.pdf": {
            type: "file" as const,
            url: "/assets/Introduction_to_cybersecurity.pdf",
            downloadable: true,
          },
          "Networking_basics.pdf": {
            type: "file" as const,
            url: "/assets/Networking_basics.pdf",
            downloadable: true,
          },
          "AICTE.pdf": {
            type: "file" as const,
            url: "/assets/BAGADI_BHARAT_INTERNSHIP.pdf",
            downloadable: true,
          },
          "info.txt": {
            type: "file" as const,
            content:
              "- Cisco: Introduction to cybersecurity\n- Cisco: Networking\n- AICTE: Java Full Stack Internship\n\nUse 'open <filename>.pdf' to view certificates.\n",
          },
        },
      },
      "contact.txt": {
        type: "file" as const,
        content:
          '<strong>Email:</strong> <a href="mailto:bharatbagadi923@gmail.com">bharatbagadi923@gmail.com</a>\n<strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/bagadi-bharat/" target="_blank" rel="noopener noreferrer">linkedin.com/in/bagadi-bharat</a>\n',
      },
    },
  },
};

type FileNode = {
  type: "file";
  content?: string;
  url?: string;
  downloadable?: boolean;
  _writeupId?: string;
};
type DirNode = { type: "dir"; children: Record<string, FileNode | DirNode> };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIFF_STYLE: Record<string, string> = {
  EASY: "color:#4ade80;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2)",
  MEDIUM:
    "color:#fbbf24;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2)",
  HARD: "color:#f87171;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2)",
};
const CAT_COLOR: Record<string, string> = {
  Web: "#38bdf8",
  Cloud: "#fb923c",
  Forensics: "#a78bfa",
  Pwn: "#f87171",
  Crypto: "#fbbf24",
  Misc: "#94a3b8",
};
const catColor = (cat: string) =>
  CAT_COLOR[cat.split("·")[0].trim()] ?? "#94a3b8";

// ─── Component ────────────────────────────────────────────────────────────────
export default function Terminal() {
  const [cwd, setCwd] = useState("/");
  const [output, setOutput] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [histPos, setHistPos] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [showSimple, setShowSimple] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "writeups">("about");
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [selectedWriteup, setSelectedWriteup] = useState<
    (typeof WRITEUPS)[0] | null
  >(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    printLine(
      "Welcome. This interactive terminal is a portfolio shell — type <code>help</code>.",
    );
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (termRef.current)
      termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [output]);

  // Listen for open-writeup events emitted from within terminal output HTML
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const wu = WRITEUPS.find((w) => w.id === e.detail);
      if (wu) {
        setSelectedWriteup(wu);
        setShowSimple(true);
        setActiveTab("writeups");
      }
    };
    document.addEventListener("open-writeup", handler as EventListener);
    return () =>
      document.removeEventListener("open-writeup", handler as EventListener);
  }, []);

  // ── Path utils ──────────────────────────────────────────────────────────────
  const normalize = (p: string) => {
    const stack: string[] = [];
    for (const part of p.split("/").filter(Boolean)) {
      if (part === ".") continue;
      part === ".." ? stack.pop() : stack.push(part);
    }
    return "/" + stack.join("/");
  };
  const pathResolve = (base: string, part?: string) => {
    if (!part) return base;
    return part.startsWith("/")
      ? normalize(part)
      : normalize(base.replace(/\/+$/, "") + "/" + part);
  };
  const getNode = (path: string): FileNode | DirNode | null => {
    const parts = path === "/" ? [] : path.slice(1).split("/");
    let node: FileNode | DirNode = fs["/"];
    for (const p of parts) {
      if (node.type !== "dir" || !node.children?.[p]) return null;
      node = node.children[p];
    }
    return node;
  };

  const printLine = (html: string) => setOutput((prev) => [...prev, html]);

  // ── Commands ────────────────────────────────────────────────────────────────
  const commands: Record<string, (args: string[]) => void> = {
    help: () => {
      printLine(
        `<span style="color:#7fb99a">commands:</span> ls · cd · cat · open · download · writeups · clear · theme`,
      );
      printLine(
        `<span style="color:#4b5563">examples: cd writeups · cat about.txt · open resume.pdf · writeups</span>`,
      );
    },
    ls: (args) => {
      const path = pathResolve(cwd, args[0] || ".");
      const node = getNode(path);
      if (!node || node.type !== "dir")
        return printLine(`ls: '${sanitizeHtml(path)}': no such directory`);
      const out = Object.keys((node as DirNode).children)
        .map((n) => {
          const child = (node as DirNode).children[n];
          return `<span style="color:${child.type === "dir" ? "#38bdf8" : "#7fb99a"}">${sanitizeHtml(n)}${child.type === "dir" ? "/" : ""}</span>`;
        })
        .join("  ");
      printLine(out);
    },
    cd: (args) => {
      const newPath = pathResolve(cwd, args[0] || "/");
      const node = getNode(newPath);
      if (!node || node.type !== "dir")
        return printLine(
          `cd: ${sanitizeHtml(args[0] ?? "")}: no such directory`,
        );
      setCwd(newPath);
    },
    cat: (args) => {
      if (!args[0]) return printLine("usage: cat &lt;file&gt;");
      const node = getNode(pathResolve(cwd, args[0]));
      if (!node || node.type !== "file")
        return printLine(`cat: ${sanitizeHtml(args[0])}: no such file`);
      if (node.content)
        printLine(
          `<div style="white-space:pre-wrap;color:#c6f2d6">${node.content}</div>`,
        );
      else
        printLine(
          `<em>${sanitizeHtml(args[0])} — use 'open ${sanitizeHtml(args[0])}' to view.</em>`,
        );
    },
    open: (args) => {
      if (!args[0]) return printLine("usage: open &lt;file&gt;");
      const full = pathResolve(cwd, args[0]);
      const node = getNode(full);
      if (!node || node.type !== "file")
        return printLine(`open: ${sanitizeHtml(args[0])}: no such file`);
      if (node._writeupId) {
        const wu = WRITEUPS.find((w) => w.id === node._writeupId);
        if (wu) {
          setSelectedWriteup(wu);
          setShowSimple(true);
          setActiveTab("writeups");
          printLine(
            `opening <span style="color:#3af5c4">${sanitizeHtml(wu.title)}</span>`,
          );
        }
        return;
      }
      if (node.url) {
        window.open(node.url, "_blank");
        printLine(`opened ${sanitizeHtml(args[0])} in new tab.`);
      } else if (node.content)
        setModalContent(
          `<pre style="white-space:pre-wrap">${sanitizeHtml(node.content)}</pre>`,
        );
      else printLine(`open: cannot open ${sanitizeHtml(args[0])}`);
    },
    writeups: () => {
      printLine(
        `<span style="color:#7fb99a">ctf writeups (${WRITEUPS.length}):</span>`,
      );
      WRITEUPS.forEach((w, i) => {
        const ds = DIFF_STYLE[w.difficulty] ?? "";
        printLine(
          `<span style="color:#4b5563">${String(i + 1).padStart(2, "0")}.</span> ` +
            `<span style="color:#3af5c4;cursor:pointer" onclick="document.dispatchEvent(new CustomEvent('open-writeup',{detail:'${w.id}'}))">` +
            `${sanitizeHtml(w.title)}</span> ` +
            `<span style="font-size:11px;padding:1px 6px;border-radius:3px;${ds}">${w.difficulty}</span>`,
        );
      });
    },
    download: (args) => {
      const what = args.join(" ").toLowerCase();
      if (what === "resume" || what === "resume.pdf") {
        const n = getNode("/resume.pdf");
        if (n && n.type === "file" && n.url) {
          const a = document.createElement("a");
          a.href = n.url;
          a.download = "Bagadi_Bharat_Resume.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          printLine("downloading resume...");
        } else printLine("resume not available.");
      } else printLine("usage: download resume");
    },
    clear: () => setOutput([]),
    theme: () => {
      document.body.classList.toggle("alt-theme");
      printLine("theme toggled.");
    },
  };

  const aliases: Record<string, string> = {
    dir: "ls",
    read: "cat",
    o: "open",
    wu: "writeups",
  };

  const handleCommand = (line: string) => {
    if (!line) return;
    const parts = sanitizeInput(line).split(/\s+/);
    const cmdRaw = parts.shift() || "";
    const fn = commands[aliases[cmdRaw] ?? cmdRaw];
    if (fn) {
      try {
        fn(parts);
      } catch (e) {
        printLine(
          `error: ${e instanceof Error ? sanitizeHtml(e.message) : "unknown"}`,
        );
      }
    } else printLine(`${sanitizeHtml(cmdRaw)}: not found. try 'help'.`);
  };

  const autocomplete = (value: string) => {
    const txt = value.trim();
    if (!txt) return value;
    const tokens = txt.split(/\s+/);
    if (tokens.length === 1) {
      const hit = [...Object.keys(commands), ...Object.keys(aliases)].find(
        (c) => c.startsWith(tokens[0]),
      );
      if (hit) return hit + " ";
    } else {
      const partial = tokens.pop() || "";
      const dir = pathResolve(cwd, partial.replace(/[^/]*$/, ""));
      const node = getNode(dir);
      if (node && node.type === "dir") {
        const match = Object.keys((node as DirNode).children).find((n) =>
          n.startsWith(partial.split("/").pop() || ""),
        );
        if (match) return tokens.join(" ") + " " + match + " ";
      }
    }
    return value;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const raw = inputValue.trim();
      printLine(
        `<span style="color:#7fb99a">mr_r0b01@portfolio:${sanitizeHtml(cwd)}$</span> ${sanitizeHtml(raw)}`,
      );
      if (raw) {
        setHistory((p) => [...p, raw]);
        setHistPos(history.length + 1);
        handleCommand(raw);
      }
      setInputValue("");
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      if (history.length && histPos > 0) {
        const p = histPos - 1;
        setHistPos(p);
        setInputValue(history[p]);
      }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (history.length && histPos < history.length - 1) {
        const p = histPos + 1;
        setHistPos(p);
        setInputValue(history[p]);
      } else {
        setHistPos(history.length);
        setInputValue("");
      }
      e.preventDefault();
    } else if (e.key === "Tab") {
      e.preventDefault();
      setInputValue(autocomplete(inputValue));
    }
  };

  const handleDownloadResume = () => {
    const n = getNode("/resume.pdf");
    if (n && n.type === "file" && n.url) {
      const a = document.createElement("a");
      a.href = n.url;
      a.download = "Bagadi_Bharat_Resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const allTags = Array.from(new Set(WRITEUPS.flatMap((w) => w.tags)));
  const filteredWriteups = filterTag
    ? WRITEUPS.filter((w) => w.tags.includes(filterTag))
    : WRITEUPS;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #071013;
          --panel: #0b1417;
          --text: #c6f2d6;
          --muted: #7fb99a;
          --accent: #3af5c4;
          --dim: #4b5563;
          --border: rgba(127, 185, 154, 0.13);
          --red: #f87171;
        }
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        body {
          background: linear-gradient(180deg, #020306 0%, #071013 60%);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family:
            var(--font-mono), "JetBrains Mono", "Fira Code", monospace;
        }

        /* ── layout ── */
        .t-wrap {
          width: 980px;
          max-width: 96%;
        }
        .t-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .t-brand {
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--accent);
          font-size: 14px;
        }
        .t-topbar-right {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .t-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 5px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.03em;
          transition:
            border-color 0.15s,
            color 0.15s;
        }
        .t-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .t-btn:focus {
          outline: 2px solid rgba(58, 245, 196, 0.2);
        }
        .t-btn.active {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* ── panel ── */
        .t-panel {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.015),
            transparent
          );
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(2, 6, 10, 0.85);
        }
        .t-chrome {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border);
        }
        .t-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .t-dot-r {
          background: #ff5f57;
        }
        .t-dot-y {
          background: #febc2e;
        }
        .t-dot-g {
          background: #28c840;
        }
        .t-chrome-label {
          margin-left: 8px;
          font-size: 11px;
          color: var(--dim);
          letter-spacing: 0.05em;
        }
        .t-breadcrumb {
          padding: 6px 14px;
          font-size: 12px;
          color: var(--dim);
          border-bottom: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.2);
        }

        /* ── terminal ── */
        .t-term {
          background: #02120f;
          padding: 14px 16px;
          min-height: 320px;
          max-height: 400px;
          overflow-y: auto;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--accent);
          cursor: text;
        }
        .t-term::-webkit-scrollbar {
          width: 4px;
        }
        .t-term::-webkit-scrollbar-thumb {
          background: #1a3a2a;
          border-radius: 4px;
        }
        .t-line {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .t-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .t-prompt {
          color: var(--muted);
          white-space: nowrap;
        }
        .t-input {
          background: transparent;
          border: 0;
          color: var(--text);
          outline: none;
          font-family: inherit;
          font-size: 13.5px;
          flex: 1;
          min-width: 0;
          caret-color: var(--accent);
        }
        .t-hint {
          padding: 7px 14px;
          font-size: 11px;
          color: var(--dim);
          border-top: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.15);
        }

        /* ── simple view ── */
        .t-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.2);
        }
        .t-tab {
          padding: 10px 20px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          color: var(--dim);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition:
            color 0.15s,
            border-color 0.15s;
        }
        .t-tab:hover {
          color: var(--muted);
        }
        .t-tab.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .t-tab-body {
          padding: 22px;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }
        .t-tab-body::-webkit-scrollbar {
          width: 4px;
        }
        .t-tab-body::-webkit-scrollbar-thumb {
          background: #1a3a2a;
          border-radius: 4px;
        }

        /* ── about ── */
        .s-sec {
          margin-bottom: 26px;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--border);
        }
        .s-sec:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .s-heading {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dim);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .s-heading::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .s-p {
          color: var(--text);
          line-height: 1.65;
          font-size: 13.5px;
          margin-bottom: 8px;
        }
        .s-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        .s-card {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 12px;
        }
        .s-card-label {
          font-size: 11px;
          color: var(--dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .s-card-val {
          font-size: 13px;
          color: var(--text);
          line-height: 1.5;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .s-card-val a {
          color: var(--accent);
          text-decoration: none;
          word-break: break-all;
        }
        .s-card-val a:hover {
          text-decoration: underline;
        }
        .proj-card {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 14px 16px;
          margin-bottom: 10px;
          transition: border-color 0.15s;
        }
        .proj-card:hover {
          border-color: rgba(58, 245, 196, 0.3);
        }
        .proj-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 5px;
        }
        .proj-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.55;
          margin-bottom: 7px;
        }
        .proj-link {
          font-size: 12px;
          color: var(--accent);
          text-decoration: none;
        }
        .proj-link:hover {
          text-decoration: underline;
        }

        /* ── writeups ── */
        .wu-toolbar {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .wu-filter-label {
          font-size: 11px;
          color: var(--dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .wu-tag {
          font-size: 11px;
          padding: 3px 9px;
          border-radius: 3px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--dim);
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.04em;
          transition:
            border-color 0.12s,
            color 0.12s;
        }
        .wu-tag:hover {
          border-color: var(--muted);
          color: var(--muted);
        }
        .wu-tag.active {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(58, 245, 196, 0.06);
        }
        .wu-count {
          font-size: 11px;
          color: var(--dim);
          margin-left: auto;
        }

        .wu-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wu-card {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 13px 15px;
          cursor: pointer;
          transition:
            border-color 0.15s,
            background 0.15s;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: start;
        }
        .wu-card:hover {
          border-color: rgba(58, 245, 196, 0.35);
          background: rgba(58, 245, 196, 0.02);
        }
        .wu-card.selected {
          border-color: var(--accent);
          background: rgba(58, 245, 196, 0.04);
        }

        .wu-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
          flex-wrap: wrap;
        }
        .wu-cat {
          font-size: 10px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .wu-diff {
          font-size: 10px;
          padding: 1px 7px;
          border-radius: 3px;
          letter-spacing: 0.06em;
          font-weight: 700;
        }
        .wu-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
          line-height: 1.3;
        }
        .wu-sum {
          font-size: 12px;
          color: var(--dim);
          line-height: 1.5;
        }
        .wu-tags {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          margin-top: 7px;
        }
        .wu-tag-s {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--dim);
          letter-spacing: 0.04em;
        }
        .wu-tag-s:hover {
          border-color: var(--muted);
          color: var(--muted);
        }
        .wu-open-btn {
          font-size: 11px;
          color: var(--accent);
          background: transparent;
          border: 1px solid rgba(58, 245, 196, 0.25);
          border-radius: 4px;
          padding: 4px 10px;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          margin-top: 2px;
          transition:
            border-color 0.12s,
            background 0.12s;
        }
        .wu-open-btn:hover {
          border-color: var(--accent);
          background: rgba(58, 245, 196, 0.08);
        }

        .wu-viewer {
          margin-top: 14px;
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }
        .wu-viewer-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 13px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border);
          gap: 10px;
          flex-wrap: wrap;
        }
        .wu-viewer-title {
          font-size: 12px;
          color: var(--muted);
        }
        .wu-viewer-close {
          font-size: 11px;
          color: var(--dim);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 3px 9px;
          cursor: pointer;
          font-family: inherit;
          transition:
            color 0.12s,
            border-color 0.12s;
        }
        .wu-viewer-close:hover {
          color: var(--red);
          border-color: rgba(248, 113, 113, 0.4);
        }
        .wu-iframe {
          width: 100%;
          height: 70vh;
          border: none;
          display: block;
          background: #fff;
        }

        /* ── modal ── */
        .t-modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(1, 1, 1, 0.65);
          z-index: 60;
          backdrop-filter: blur(4px);
        }
        .t-modal-box {
          background: #fff;
          color: #000;
          padding: 20px;
          border-radius: 8px;
          max-width: 92%;
          max-height: 90%;
          overflow: auto;
        }

        /* ── responsive ── */
        @media (max-width: 640px) {
          body {
            padding: 12px;
          }
          .t-term {
            min-height: 220px;
            max-height: 300px;
            font-size: 12.5px;
          }
          .t-tab-body {
            padding: 14px;
          }
          .wu-iframe {
            height: 55vh;
          }
          .wu-card {
            grid-template-columns: 1fr;
          }
          .t-topbar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="t-wrap">
        {/* ── Top bar ── */}
        <div className="t-topbar">
          <div className="t-brand">mr_r0b01@portfolio</div>
          <div className="t-topbar-right">
            <button
              className={`t-btn${showSimple && activeTab === "writeups" ? " active" : ""}`}
              onClick={() => {
                setShowSimple(true);
                setActiveTab("writeups");
              }}
            >
              writeups/
            </button>
            <button
              className={`t-btn${showSimple && activeTab === "about" ? " active" : ""}`}
              onClick={() => {
                setShowSimple(true);
                setActiveTab("about");
              }}
            >
              about
            </button>
            <button
              className={`t-btn${!showSimple ? " active" : ""}`}
              onClick={() => {
                setShowSimple(false);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            >
              terminal
            </button>
            <button className="t-btn" onClick={handleDownloadResume}>
              resume.pdf
            </button>
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="t-panel">
          {/* Window chrome */}
          <div className="t-chrome">
            <div className="t-dot t-dot-r" />
            <div className="t-dot t-dot-y" />
            <div className="t-dot t-dot-g" />
            <span className="t-chrome-label">
              {showSimple
                ? activeTab === "writeups"
                  ? "writeups — ctf walkthroughs"
                  : "about — bagadi bharat"
                : "terminal — mr_r0b01@portfolio"}
            </span>
          </div>

          {/* ── Terminal ── */}
          {!showSimple && (
            <>
              <div className="t-breadcrumb">{cwd}</div>
              <div
                className="t-term"
                ref={termRef}
                onClick={() => inputRef.current?.focus()}
                role="region"
                aria-label="Interactive terminal"
              >
                {output.map((line, i) => (
                  <div
                    key={i}
                    className="t-line"
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
                <div className="t-input-row">
                  <span className="t-prompt">mr_r0b01@portfolio:{cwd}$</span>
                  <input
                    ref={inputRef}
                    className="t-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Terminal command input"
                  />
                </div>
              </div>
              <div className="t-hint">
                <code>help</code> — commands &nbsp;·&nbsp;
                <code>Tab</code> — autocomplete &nbsp;·&nbsp;
                <code>writeups</code> — list ctf writeups &nbsp;·&nbsp;
                <code>↑↓</code> — history
              </div>
            </>
          )}

          {/* ── Simple view ── */}
          {showSimple && (
            <>
              <div className="t-tabs">
                <button
                  className={`t-tab${activeTab === "about" ? " active" : ""}`}
                  onClick={() => setActiveTab("about")}
                >
                  about
                </button>
                <button
                  className={`t-tab${activeTab === "writeups" ? " active" : ""}`}
                  onClick={() => setActiveTab("writeups")}
                >
                  writeups ({WRITEUPS.length})
                </button>
              </div>

              <div className="t-tab-body">
                {/* ───── About tab ───── */}
                {activeTab === "about" && (
                  <>
                    <div className="s-sec">
                      <div className="s-heading">whoami</div>
                      <p className="s-p">
                        Hi, I&apos;m <strong>Bagadi Bharat</strong> — a web
                        developer, cybersecurity practitioner, and CTF
                        competitor. I specialize in full-stack development, web
                        application security, and network exploitation.
                      </p>
                      <p className="s-p">
                        I enjoy building scalable applications, breaking systems
                        to understand how they work, and helping organizations
                        strengthen their security.
                      </p>
                    </div>

                    <div className="s-sec">
                      <div className="s-heading">contact</div>
                      <div className="s-grid">
                        {[
                          [
                            "Email",
                            <a href="mailto:bharatbagadi923@gmail.com">
                              bharatbagadi923@gmail.com
                            </a>,
                          ],
                          [
                            "LinkedIn",
                            <a
                              href="https://www.linkedin.com/in/bagadi-bharat/"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              bagadi-bharat
                            </a>,
                          ],
                          [
                            "GitHub",
                            <a
                              href="https://github.com/thebharat07"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              @thebharat07
                            </a>,
                          ],
                          [
                            "Medium",
                            <a
                              href="https://medium.com/@bharatbagadi923"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              @bharatbagadi923
                            </a>,
                          ],
                          [
                            "LeetCode",
                            <a
                              href="https://leetcode.com/u/mr_r0b01/"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              mr_r0b01
                            </a>,
                          ],
                        ].map(([label, val]) => (
                          <div key={String(label)} className="s-card">
                            <div className="s-card-label">{label}</div>
                            <div className="s-card-val">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="s-sec">
                      <div className="s-heading">projects</div>
                      <div className="proj-card">
                        <div className="proj-title">PulseView</div>
                        <div className="proj-desc">
                          Browser extension to capture and display live POST,
                          PUT, and GET requests from active tabs. Dynamic
                          visualization of API traffic with interactive graphs.
                        </div>
                        <a
                          className="proj-link"
                          href="https://github.com/thebharat07/PulseView"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          github.com/thebharat07/PulseView →
                        </a>
                      </div>
                      <div className="proj-card">
                        <div className="proj-title">
                          Vulnverse — MediLabs NG
                        </div>
                        <div className="proj-desc">
                          Full walkthrough of the MediLabs NG VM covering recon,
                          exploitation, privilege escalation, and
                          post-exploitation. Includes commands, PoCs, and
                          remediation notes.
                        </div>
                        <a
                          className="proj-link"
                          href="https://medium.com/@bharatbagadi923/vulnverse-medilabs-ng-walkthrough-a60f77f6101b"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Read on Medium →
                        </a>
                      </div>
                    </div>

                    <div className="s-sec">
                      <div className="s-heading">stack</div>
                      <div className="s-grid">
                        {[
                          [
                            "Languages",
                            "Java, Python, C, JavaScript, Assembly",
                          ],
                          [
                            "Frameworks",
                            "React, Next.js, Spring Boot, Django, Flask",
                          ],
                          ["Databases", "MySQL, PostgreSQL, MongoDB"],
                          [
                            "Pentesting",
                            "nmap, gobuster, Burp Suite, Metasploit, Wireshark",
                          ],
                          ["RE / Debug", "gdb, basic assembly debugging"],
                          ["OS", "Kali Linux, Arch Linux, Ubuntu, Windows"],
                        ].map(([label, val]) => (
                          <div key={label} className="s-card">
                            <div className="s-card-label">{label}</div>
                            <div
                              className="s-card-val"
                              style={{ fontSize: "12px" }}
                            >
                              {val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="s-sec">
                      <div className="s-heading">certificates</div>
                      <div className="s-grid">
                        {[
                          [
                            "Cisco",
                            "Introduction to CyberSecurity",
                            "/assets/Introduction_to_cybersecurity.pdf",
                          ],
                          [
                            "Cisco",
                            "Networking Basics",
                            "/assets/Networking_basics.pdf",
                          ],
                          [
                            "AICTE",
                            "Java Full Stack Internship",
                            "/assets/BAGADI_BHARAT_INTERNSHIP.pdf",
                          ],
                        ].map(([org, name, url]) => (
                          <div key={name} className="s-card">
                            <div className="s-card-label">{org}</div>
                            <div
                              className="s-card-val"
                              style={{ fontSize: "12px", marginBottom: "6px" }}
                            >
                              {name}
                            </div>
                            <a
                              className="proj-link"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: "11px" }}
                            >
                              view cert →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ───── Writeups tab ───── */}
                {activeTab === "writeups" && (
                  <>
                    {/* Filter toolbar */}
                    <div className="wu-toolbar">
                      <span className="wu-filter-label">filter</span>
                      <button
                        className={`wu-tag${!filterTag ? " active" : ""}`}
                        onClick={() => setFilterTag(null)}
                      >
                        all
                      </button>
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          className={`wu-tag${filterTag === tag ? " active" : ""}`}
                          onClick={() =>
                            setFilterTag(filterTag === tag ? null : tag)
                          }
                        >
                          {tag}
                        </button>
                      ))}
                      <span className="wu-count">
                        {filteredWriteups.length} result
                        {filteredWriteups.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Card list */}
                    <div className="wu-list">
                      {filteredWriteups.map((wu) => {
                        const ds = DIFF_STYLE[wu.difficulty] ?? "";
                        const isSelected = selectedWriteup?.id === wu.id;
                        return (
                          <div
                            key={wu.id}
                            className={`wu-card${isSelected ? " selected" : ""}`}
                            onClick={() =>
                              window.open(`/writeups/${wu.slug}`, "_blank")
                            }
                          >
                            <div>
                              <div className="wu-meta">
                                <span
                                  className="wu-cat"
                                  style={{ color: catColor(wu.category) }}
                                >
                                  {wu.category}
                                </span>
                                <span
                                  className="wu-diff"
                                  style={{ cssText: ds } as React.CSSProperties}
                                >
                                  {wu.difficulty}
                                </span>
                              </div>
                              <div className="wu-title">{wu.title}</div>
                              <div className="wu-sum">{wu.summary}</div>
                              <div className="wu-tags">
                                {wu.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="wu-tag-s"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFilterTag(filterTag === t ? null : t);
                                    }}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              className="wu-open-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/writeups/${wu.slug}`, "_blank");
                              }}
                              aria-label={`Open writeup: ${wu.title}`}
                            >
                              {isSelected ? "close ✕" : "read →"}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline iframe viewer */}
                    {selectedWriteup && (
                      <div className="wu-viewer">
                        <div className="wu-viewer-hdr">
                          <span className="wu-viewer-title">
                            {selectedWriteup.title}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <a
                              href={`/writeups/${selectedWriteup.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "11px",
                                color: "var(--accent)",
                                textDecoration: "none",
                              }}
                            >
                              open in tab ↗
                            </a>
                            <button
                              className="wu-viewer-close"
                              onClick={() => setSelectedWriteup(null)}
                            >
                              close ✕
                            </button>
                          </div>
                        </div>
                        <iframe
                          className="wu-iframe"
                          src={`/writeups/${selectedWriteup.slug}`}
                          title={selectedWriteup.title}
                          loading="lazy"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalContent && (
        <div
          className="t-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalContent(null)}
        >
          <div className="t-modal-box" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <button className="t-btn" onClick={() => setModalContent(null)}>
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
