"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { sanitizeInput, sanitizeHtml } from "@/lib/sanitize"

// File system structure
const fs = {
  "/": {
    type: "dir" as const,
    children: {
      "about.txt": {
        type: "file" as const,
        content: "Hi, I'm Bagadi Bharat — a web developer, penetration tester, and CTF competitor. I specialize in full-stack development, web application security, and network exploitation.\nI enjoy building scalable applications, breaking systems to understand how they work, and helping organizations strengthen their security. Outside of work, I write walkthroughs, explore new tools, and participate in hackathons.",
      },
      "resume.pdf": { type: "file" as const, url: "/assets/Bagadi_Bharat_CV.pdf", downloadable: true },
      projects: {
        type: "dir" as const,
        children: {
          "PulseView": {
            type: "dir" as const,
            children: {
              "info.txt": {
                type: "file" as const,
                content: '<p><strong>Project:</strong> PulseView 2 - REST API Monitoring Browser Extension</p>\n<p><strong>Description:</strong></p>\n<ul><li>Developed a browser extension to capture and display live POST, PUT, and GET requests made by active browser tabs.</li>\n<li>Implemented dynamic visualization of API traffic using interactive graphs for better analysis and debugging.</li>\n<li>Enhanced developer productivity by providing real-time monitoring of REST requests within a single browser window.</li>\n</ul><p><strong>Link:</strong> <a href="https://github.com/thebharat07/PulseView" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>\n',
              },
            },
          },

        },
      },
      writeups: {
        type: "dir" as const,
        children: {
          mediLabs_walkthrough: {
            type: "dir" as const,
            children: { "writeup.txt":
              {type: "file" as const, content: '\nLab VM sourced from the <strong>vulnverse</strong> GitHub repo. Full walkthrough of the MediLabs NG machine covering reconnaissance, exploitation, privilege escalation, and post-exploitation techniques. Includes commands, PoCs, and remediation notes.\n\n<p><a href="https://medium.com/@bharatbagadi923/vulnverse-medilabs-ng-walkthrough-a60f77f6101b" target="_blank" rel="noopener noreferrer">Read Walkthrough → </a></p>\n' } },
          },
        },
      },
      tools: {
        type: "dir" as const,
        children: {
          "tools.txt": { type: "file" as const, content: 'Tools & Resources\n<p>Selected languages, frameworks, tools and OS I use regularly:</p>\n<strong>Languages</strong><div>Java, Python, C, JavaScript, Assembly (beginner)</div>\n<strong>Frameworks & Libraries</strong><div>React, Next.js, Spring Boot, Django, Flask, Express</div>\n<strong>Databases</strong><div>MySQL, PostgreSQL, MongoDB</div>\n<strong>Design & Prototyping</strong><div>Canva (intermediate), Figma (beginner)</div>\n<strong>Penetration Testing & Recon</strong><div>nmap, nikto, gobuster, Burp Suite, Wireshark (beginner), Metasploit (beginner)</div>\n<strong>Debugging & Reverse Engineering</strong><div>gdb, basic assembly debugging</div>\n<strong>Operating Systems</strong><div>Windows, Kali Linux, Arch Linux, Ubuntu</div>\n' },
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

      "contact.txt": { type: "file" as const, content: '<strong>Email:</strong> <a href="mailto:bharatbagadi923@gmail.com">bharatbagadi923@gmail.com</a>\n<strong>LinkedIn:</strong><a href="https://www.linkedin.com/in/bagadi-bharat/" target="_blank" rel="noopener noreferrer">linkedin.com/in/bagadi-bharat</a>\n' },
    },
  },
}

type FileNode = {
  type: "file"
  content?: string
  url?: string
  downloadable?: boolean
}

type DirNode = {
  type: "dir"
  children: Record<string, FileNode | DirNode>
}

export default function Terminal() {
  const [cwd, setCwd] = useState("/")
  const [output, setOutput] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [histPos, setHistPos] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [showSimple, setShowSimple] = useState(false)
  const [modalContent, setModalContent] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    printLine("Welcome. This interactive terminal is a portfolio shell — type 'help'.")
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [output])

  const pathResolve = (base: string, part?: string): string => {
    if (!part) return base
    if (part.startsWith("/")) return normalize(part)
    const joined = base.replace(/\/+$/, "") + "/" + part
    return normalize(joined)
  }

  const normalize = (p: string): string => {
    const parts = p.split("/").filter(Boolean)
    const stack: string[] = []
    for (const part of parts) {
      if (part === ".") continue
      if (part === "..") stack.pop()
      else stack.push(part)
    }
    return "/" + stack.join("/")
  }

  const getNode = (path: string): FileNode | DirNode | null => {
    const parts = path === "/" ? [] : path.slice(1).split("/")
    let node: FileNode | DirNode = fs["/"]
    for (const p of parts) {
      if (node.type !== "dir" || !node.children || !node.children[p]) return null
      node = node.children[p]
    }
    return node
  }

  const printLine = (html: string) => {
    setOutput((prev) => [...prev, html])
  }

  const commands: Record<string, (args: string[]) => void> = {
    help: () => {
      printLine(
        `<span style="color:#7fb99a">Available commands:</span> ls, cd, cat, open, download, help, clear, theme`,
      )
      printLine(
        `Examples: <code>ls</code> <code>cd projects</code> <code>cat about.txt</code> <code>open resume.pdf</code>`,
      )
    },

    ls: (args) => {
      const path = pathResolve(cwd, args[0] || ".")
      const node = getNode(path)
      if (!node || node.type !== "dir") return printLine(`ls: cannot access '${sanitizeHtml(path)}': No such directory`)
      const names = Object.keys(node.children || {})
        .map((n) => {
          const t = node.children[n].type === "dir" ? "/" : ""
          return `<span style="color:#7fb99a">${sanitizeHtml(n)}${t}</span>`
        })
        .join("  ")
      printLine(names)
    },

    cd: (args) => {
      const target = args[0] || "/"
      const newPath = pathResolve(cwd, target)
      const node = getNode(newPath)
      if (!node || node.type !== "dir") return printLine(`cd: ${sanitizeHtml(target)}: No such directory`)
      setCwd(newPath)
    },

cat: (args) => {
  const target = args[0];
  if (!target) return printLine("Usage: cat <file>");

  const full = pathResolve(cwd, target);
  const node = getNode(full);

  if (!node || node.type !== "file") {
    return printLine(`cat: ${sanitizeHtml(target)}: No such file`);
  }

  if (node.content) {
    // Here we pass HTML directly, it will render via dangerouslySetInnerHTML
    printLine(`<div style="white-space:pre-wrap;color:#c6f2d6">${node.content}</div>`);
  } else {
    printLine(`<em>${sanitizeHtml(target)} has no preview. Use open to download/open it.</em>`);
  }
},

    open: (args) => {
      const target = args[0]
      if (!target) return printLine("Usage: open <file>")
      const full = pathResolve(cwd, target)
      const node = getNode(full)
      if (!node || node.type !== "file") return printLine(`open: ${sanitizeHtml(target)}: No such file`)

      if (node.downloadable || node.url) {
        const url = node.url || "#"
        window.open(url, "_blank")
        printLine(`Opened ${sanitizeHtml(target)} in a new tab.`)
      } else if (node.content) {
        setModalContent(
          `<pre style="white-space:pre-wrap;font-family:var(--font-mono)">${sanitizeHtml(node.content)}</pre>`,
        )
      } else {
        printLine(`open: cannot open ${sanitizeHtml(target)}`)
      }
    },

    download: (args) => {
      const what = args.join(" ")
      if (what.toLowerCase() === "resume" || what.toLowerCase() === "resume.pdf") {
        const node = getNode("/resume.pdf")
        if (node && node.type === "file" && node.url) {
          const a = document.createElement("a")
          a.href = node.url
          a.download = "Bagadi_Bharat_Resume.pdf"
          document.body.appendChild(a)
          a.click()
          a.remove()
          printLine("Downloading resume...")
        } else printLine("Resume not available.")
      } else {
        printLine("Usage: download resume")
      }
    },

    clear: () => {
      setOutput([])
    },

    theme: () => {
      document.body.classList.toggle("alt-theme")
      printLine("Toggled theme.")
    },
  }

  const aliases: Record<string, string> = { dir: "ls", read: "cat", o: "open" }

  const handleCommand = (line: string) => {
    if (!line) return
    const sanitized = sanitizeInput(line)
    const parts = sanitized.split(/\s+/)
    const cmdRaw = parts.shift() || ""
    const cmd = aliases[cmdRaw] || cmdRaw
    const fn = commands[cmd]

    if (fn) {
      try {
        fn(parts)
      } catch (err) {
        printLine(`Error running command: ${err instanceof Error ? sanitizeHtml(err.message) : "Unknown error"}`)
      }
    } else {
      printLine(`${sanitizeHtml(cmdRaw)}: command not found. Try 'help'.`)
    }
  }

  const autocomplete = (value: string): string => {
    const txt = value.trim()
    if (txt === "") return value
    const tokens = txt.split(/\s+/)

    if (tokens.length === 1) {
      const candidates = Object.keys(commands).concat(Object.keys(aliases))
      const hit = candidates.find((c) => c.startsWith(tokens[0]))
      if (hit) return hit + " "
    } else {
      const partial = tokens.pop() || ""
      const dir = pathResolve(cwd, partial.replace(/[^/]*$/, ""))
      const node = getNode(dir)
      if (node && node.type === "dir") {
        const names = Object.keys(node.children).filter((n) => n.startsWith(partial))
        if (names.length) return tokens.join(" ") + " " + names[0] + " "
      }
    }
    return value
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const raw = inputValue.trim()
      printLine(`<span style="color:#7fb99a">mr_r0b01@portfolio:${sanitizeHtml(cwd)}$</span> ${sanitizeHtml(raw)}`)
      if (raw) {
        setHistory((prev) => [...prev, raw])
        setHistPos(history.length + 1)
        handleCommand(raw)
      }
      setInputValue("")
      e.preventDefault()
    } else if (e.key === "ArrowUp") {
      if (history.length && histPos > 0) {
        const newPos = histPos - 1
        setHistPos(newPos)
        setInputValue(history[newPos])
      }
      e.preventDefault()
    } else if (e.key === "ArrowDown") {
      if (history.length && histPos < history.length - 1) {
        const newPos = histPos + 1
        setHistPos(newPos)
        setInputValue(history[newPos])
      } else {
        setHistPos(history.length)
        setInputValue("")
      }
      e.preventDefault()
    } else if (e.key === "Tab") {
      e.preventDefault()
      setInputValue(autocomplete(inputValue))
    }
  }

  const handleDownloadResume = () => {
    const node = getNode("/resume.pdf")
    if (node && node.type === "file" && node.url) {
      const a = document.createElement("a")
      a.href = node.url
      a.download = "Bagadi_Bharat_Resume.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } else {
      printLine("Resume not available.")
    }
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #071013;
          --panel: #0b1417;
          --text: #c6f2d6;
          --muted: #7fb99a;
          --accent: #3af5c4;
        }
        
        body {
          background: linear-gradient(180deg, #020306 0%, #071013 60%);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        
        .terminal-container {
          width: 960px;
          max-width: 95%;
        }
        
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .terminal-brand {
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 1px;
        }
        
        .terminal-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .terminal-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--muted);
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
        }
        
        .terminal-button:hover {
          border-color: rgba(255, 255, 255, 0.12);
        }
        
        .terminal-button:focus {
          outline: 2px solid rgba(58, 245, 196, 0.18);
        }
        
        .terminal-panel {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
          border-radius: 8px;
          padding: 14px;
          box-shadow: 0 8px 30px rgba(2, 6, 10, 0.8);
        }
        
        .terminal-breadcrumb {
          font-family: var(--font-mono);
          color: var(--muted);
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .terminal-term {
          background: #02120f;
          border-radius: 6px;
          padding: 16px;
          min-height: 360px;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.5;
          position: relative;
          overflow: auto;
          cursor: text;
        }
        
        .terminal-line {
          white-space: pre-wrap;
        }
        
        .terminal-prompt {
          color: var(--accent);
        }
        
        .terminal-input {
          background: transparent;
          border: 0;
          color: var(--text);
          outline: none;
          font-family: var(--font-mono);
          font-size: 14px;
          flex: 1;
          width: 100%;
        }
        
        .terminal-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 6px;
        }
        
        .terminal-muted {
          color: var(--muted);
          font-size: 13px;
          margin-top: 10px;
        }
        
        .terminal-simple-view {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 8px 30px rgba(2, 6, 10, 0.8);
        }
        
        .simple-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(127, 185, 154, 0.15);
        }
        
        .simple-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .simple-section h2 {
          font-family: var(--font-mono);
          color: var(--accent);
          font-size: 20px;
          margin: 0 0 16px 0;
          font-weight: 700;
        }
        
        .simple-section h3 {
          font-family: var(--font-mono);
          color: var(--muted);
          font-size: 16px;
          margin: 16px 0 8px 0;
          font-weight: 600;
        }
        
        .simple-section p {
          color: var(--text);
          line-height: 1.6;
          margin: 8px 0;
        }
        
        .simple-section ul {
          list-style: none;
          padding: 0;
          margin: 12px 0;
        }
        
        .simple-section li {
          padding: 8px 0;
          color: var(--text);
          line-height: 1.6;
        }
        
        .simple-section a {
          color: var(--accent);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }
        
        .simple-section a:hover {
          border-bottom-color: var(--accent);
        }
        
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        
        .profile-item {
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
          border-radius: 6px;
          border: 1px solid rgba(127, 185, 154, 0.1);
        }
        
        .profile-item strong {
          color: var(--muted);
          display: block;
          margin-bottom: 4px;
          font-family: var(--font-mono);
          font-size: 13px;
        }
        
        .project-card {
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 12px;
          border: 1px solid rgba(127, 185, 154, 0.1);
        }
        
        .project-card h4 {
          color: var(--accent);
          font-family: var(--font-mono);
          margin: 0 0 8px 0;
          font-size: 16px;
        }
        
        .project-card p {
          margin: 4px 0;
          font-size: 14px;
        }
        
        .terminal-modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(1, 1, 1, 0.6);
          z-index: 60;
          backdrop-filter: blur(4px);
        }
        
        .terminal-modal-box {
          background: white;
          color: black;
          padding: 18px;
          border-radius: 8px;
          max-width: 90%;
          max-height: 90%;
          overflow: auto;
        }
        
        @media (max-width: 640px) {
          .terminal-term {
            min-height: 260px;
            font-size: 13px;
          }
          
          .profile-grid {
            grid-template-columns: 1fr;
          }
          
          .terminal-simple-view {
            padding: 16px;
          }
        }
      `}</style>

      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-brand">mr_r0b01@portfolio</div>
          <div className="terminal-controls">
            <button className="terminal-button" onClick={() => setShowSimple(!showSimple)}>
              {showSimple ? "Switch to Terminal View" : "Switch to Simple View"}
            </button>
            <button className="terminal-button" onClick={handleDownloadResume}>
              Download Resume
            </button>
          </div>
        </div>

        {!showSimple ? (
          <div className="terminal-panel">
            <div className="terminal-breadcrumb">{cwd}</div>
            <div
              className="terminal-term"
              ref={termRef}
              onClick={() => inputRef.current?.focus()}
              role="region"
              aria-label="Interactive terminal"
            >
              <div ref={outputRef}>
                {output.map((line, i) => (
                  <div key={i} className="terminal-line" dangerouslySetInnerHTML={{ __html: line }} />
                ))}
              </div>

              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">mr_r0b01@portfolio:{cwd}$</span>
                <input
                  ref={inputRef}
                  className="terminal-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  aria-label="Terminal command input"
                />
              </div>
            </div>
            <div className="terminal-muted">
              Type <code>help</code> for available commands. Press Tab to autocomplete an entry.
            </div>
          </div>
        ) : (
          <div className="terminal-simple-view">
            {/* Main Details Section */}
<section className="simple-section">
  <h2>About Me</h2>
  <p>
    Hi, I&apos;m <strong>Bagadi Bharat</strong> — a web developer, penetration tester, and CTF competitor. 
    I specialize in full-stack development, web application security, and network exploitation.
  </p>
  <p>
    I enjoy building scalable applications, breaking systems to understand how they work, and helping 
    organizations strengthen their security. Outside of work, I write walkthroughs, explore new tools, 
    and participate in hackathons.
  </p>
</section>


            {/* Contact Section */}
            <section className="simple-section">
              <h2>Contact</h2>  
              <p>
                <strong>Email:</strong> <a href="mailto:bharatbagadi923@gmail.com">bharatbagadi923@gmail.com</a>

              </p>
              <p>
                <strong>LinkedIn:</strong>{" "}
                <a href="https://www.linkedin.com/in/bagadi-bharat/" target="_blank" rel="noopener noreferrer">
                  linkedin.com/in/bagadi-bharat
                </a>
              </p>
            </section>

            {/* Coding Profiles Section */}
            <section className="simple-section">
              <h2>Profiles</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <strong>Leetcode</strong>
                  <a href="https://leetcode.com/u/mr_r0b01/" target="_blank" rel="noopener noreferrer">
                   mr_r0b01 
                  </a>
                </div>
                <div className="profile-item">
                  <strong>GitHub</strong>
                  <a href="https://github.com/thebharat07" target="_blank" rel="noopener noreferrer">
                    @thebharat07
                  </a>
                </div>
                <div className="profile-item">
                  <strong>Medium</strong>
                  <a href="https://medium.com/@bharatbagadi923" target="_blank" rel="noopener noreferrer">
                    bharat
                  </a>
                </div>

                <div className="profile-item">
                  <strong>Hackerrank</strong>
                  <a href="https://www.hackerrank.com/profile/bharatbagadi923" target="_blank" rel="noopener noreferrer">
                    bharatbagadi923
                  </a>
                </div>
              </div> 
            </section>

            {/* Certificates Section */}
            <section className="simple-section">
              <h2>Certificates</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <strong>Cisco</strong>
                  <p style={{ fontSize: "13px", margin: "4px 0 8px 0", color: "var(--muted)" }}>
                  Introduction to CyberSecurity  
                  </p>
                  <a href="/assets/Introduction_to_cybersecurity.pdf" target="_blank" rel="noopener noreferrer">
                    View Certificate
                  </a>
                </div>
                <div className="profile-item">
                  <strong>Cisco</strong>
                  <p style={{ fontSize: "13px", margin: "4px 0 8px 0", color: "var(--muted)" }}>
                    Networking
                  </p>
                  <a href="/assets/Networking_basics.pdf" target="_blank" rel="noopener noreferrer">
                    View Certificate
                  </a>
                </div>
                <div className="profile-item">
                  <strong>AICTE</strong>
                  <p style={{ fontSize: "13px", margin: "4px 0 8px 0", color: "var(--muted)" }}>
                    Java Full Stack Internship
                  </p>
                  <a href="/assets/BAGADI_BHARAT_INTERNSHIP.pdf" target="_blank" rel="noopener noreferrer">
                    View Certificate
                  </a>
                </div>
{/*                <div className="profile-item">
                  <strong>CompTIA Security+</strong>
                  <p style={{ fontSize: "13px", margin: "4px 0 8px 0", color: "var(--muted)" }}>
                    Security Fundamentals
                  </p>
                  <a href="/assets/certificates/comptia-security-plus.pdf" target="_blank" rel="noopener noreferrer">
                    View Certificate
                  </a>
                </div>
                */}
              </div>
            </section>

            {/* Projects Section */}
            <section className="simple-section">
              <h2>Projects & Writeups</h2>

<div className="project-card">
  <h4>PulseView</h4>
  <p>
    A browser extension to capture and display live POST, PUT, and GET requests from active tabs. 
    Features dynamic visualization of API traffic with interactive graphs for debugging and analysis.
  </p>
  <p>
    <a href="https://github.com/thebharat07/PulseView" target="_blank" rel="noopener noreferrer">
      View Project →
    </a>
  </p>
</div>

<div className="project-card">
  <h4>Vulnverse — MediLabs NG</h4>
  <p>
    Lab VM sourced from the <strong>vulnverse</strong> GitHub repo. Full walkthrough of the MediLabs NG machine
    covering reconnaissance, exploitation, privilege escalation, and post-exploitation techniques. Includes
    commands, PoCs, and remediation notes.
  </p>
  <p>
    <a href="https://medium.com/@bharatbagadi923/vulnverse-medilabs-ng-walkthrough-a60f77f6101b" target="_blank" rel="noopener noreferrer">
      Read Walkthrough →
    </a>
  </p>
</div>


<section className="simple-section">
  <h3>Tools & Resources</h3>
  <p>Selected languages, frameworks, tools and OS I use regularly:</p>

  <div className="profile-grid">
    <div className="profile-item">
      <strong>Languages</strong>
      <div>Java, Python, C, JavaScript, Assembly (beginner)</div>
    </div>

    <div className="profile-item">
      <strong>Frameworks & Libraries</strong>
      <div>React, Next.js, Spring Boot, Django, Flask, Express</div>
    </div>

    <div className="profile-item">
      <strong>Databases</strong>
      <div>MySQL, PostgreSQL, MongoDB</div>
    </div>

    <div className="profile-item">
      <strong>Design & Prototyping</strong>
      <div>Canva (intermediate), Figma (beginner)</div>
    </div>

    <div className="profile-item">
      <strong>Penetration Testing & Recon</strong>
      <div>
        nmap, nikto, gobuster, Burp Suite, Wireshark (beginner), Metasploit (beginner)
      </div>
    </div>

    <div className="profile-item">
      <strong>Debugging & Reverse Engineering</strong>
      <div>gdb, basic assembly debugging</div>
    </div>

    <div className="profile-item">
      <strong>Operating Systems</strong>
      <div>Windows, Kali Linux, Arch Linux, Ubuntu</div>
    </div>
  </div>
</section>

            </section>

            {/* Resume Section 
            <section className="simple-section">
              <h2>Resume</h2>
              <p>Download my full resume to learn more about my experience, certifications, and technical skills.</p>
              <p>
                <button className="terminal-button" onClick={handleDownloadResume} style={{ marginTop: "8px" }}>
                  Download Resume (PDF)
                </button>
              </p>
            </section> */}

            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", marginTop: "24px" }}>
              <em>Prefer an interactive experience? Switch back to the terminal view above.</em>
            </p>
          </div>
        )}
      </div>

      {modalContent && (
        <div className="terminal-modal" role="dialog" aria-modal="true" onClick={() => setModalContent(null)}>
          <div className="terminal-modal-box" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <button className="terminal-button" onClick={() => setModalContent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
