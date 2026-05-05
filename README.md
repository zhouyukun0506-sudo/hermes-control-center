# Workbench with Hermes Agent

A premium productivity workspace powered by Hermes Agent, featuring macOS 26 Liquid Glass design with real-time monitoring and full-suite agent management.

![Version](https://img.shields.io/badge/version-1.4.0-0087FF)
![Electron](https://img.shields.io/badge/Electron-41-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Quick Install

### Prerequisites

| Platform | Git | Node.js |
|----------|-----|---------|
| macOS | `xcode-select --install` | `brew install node` |
| Windows | `winget install Git.Git` | `winget install OpenJS.NodeJS.LTS` |
| Linux (Ubuntu/Debian) | `sudo apt install git` | `sudo apt install nodejs npm` |
| Linux (Fedora) | `sudo dnf install git` | `sudo dnf install nodejs npm` |

> Restart your terminal after installing prerequisites.

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/zhouyukun0506-sudo/hermes-control-center/main/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/zhouyukun0506-sudo/hermes-control-center/main/install.ps1 | iex
```

### After install

```bash
# macOS / Linux
cd ~/.hermes-control && npm run electron   # Desktop app
cd ~/.hermes-control && npm run dev        # Browser (localhost:3456)

# Windows PowerShell
cd $env:USERPROFILE\.hermes-control
npm run electron   # Desktop app
npm run dev        # Browser (localhost:3456)
```

### Pre-built Windows Executable (no Node.js required)

Download from [Releases](https://github.com/zhouyukun0506-sudo/hermes-control-center/releases/tag/v1.4.0):

| File | Architecture |
|------|-------------|
| `workbench-win-x64.zip` | Intel / AMD 64-bit |
| `workbench-win-arm64.zip` | ARM (Surface, Snapdragon) |

Extract the zip and run `Workbench.exe`.

---

## Overview

Hermes Control Center is the desktop companion for the Hermes AI Agent. It provides a visually immersive environment to manage agents, monitor system health, browse files, review logs, and customize the experience — all through a floating glass interface.

## Features

### Control & Monitor
- **Control Center** — One-click start/stop for the Hermes core service
- **Activity Monitor** — Real-time CPU and memory telemetry
- **Command Line** — Integrated PTY-driven terminal with silent resize
- **Session Manager** — List, inspect, create, rename, and delete agent sessions
- **Log Viewer** — Live SSE-streamed logs from the backend

### Agents
- **Hermes Core UI** — Full web interface to the Hermes agent
- **Mimo** — Agent planning interface
- **Kimi Intelligence** — Knowledge agent interface
- **DeepSeek** — Search/reasoning agent interface
- **Gemini Pro** — Chat agent interface

### Tools & Productivity
- **Calendar** — Local JSON-backed event management with Pomodoro timer
- **File Browser** — Native filesystem browsing with preview
- **Workspaces** — Quick-access project directories
- **Usage Insights** — Token usage and activity trends
- **Model Explorer** — Browse available models and their capabilities
- **Deploy Agents** — One-click install for OpenClaw & Hermes Agent

### Customization
- **Theme Customizer** — 14 preset themes (Deep Dark, Neon Matrix, Vaporwave, Light Mode, 5 color themes, 5 Pantone-inspired colorways)
- **Custom Colors** — Pick your own accent and background colors
- **Typography** — Inter, MiSans, Playfair Display, JetBrains Mono, SF Pro
- **8 Design Styles** — Liquid Glass, Neumorphism, Flat, Material, Minimalism, Claymorphism, Bento, Editorial
- **Liquid Glass Design** — 7-layer shadow system, blur-backed glass panels, highlight borders

### Navigation & Shortcuts
- **Command Palette** — Press `⌘K` to search and run any action
- **Quick Actions Toolbar** — Pinned shortcuts at the top
- **Keyboard Navigation** — `⌘1-9` for direct page switching, `⌘[/⌘]` for back/forward, `↑/↓` to cycle pages
- **Collapsible Sidebar** — Icon-only mode with collapsible section groups
- **Custom Groups** — Rename sections, drag items between groups, reorder sections

## Screenshots

*(Screenshots coming soon)*

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Python 3** (for the PTY terminal bridge)
- **Hermes AI Agent** (backend service)

### Quick Start (Browser)

```bash
# Install dependencies
npm install

# Install concurrently (if not already)
npm install -g concurrently

# Start backend + Vite dev server
npm run dev
```

Open http://localhost:3456 in your browser.

### Desktop App (Electron)

```bash
# Build frontend
npm run build

# Launch Electron window
npm run electron
```

The Electron build provides native window decorations, transparent rounded corners, and macOS traffic light buttons.

### Backend Only

```bash
node server/index.js
```

Stands up the control server on port 3456 with proxy to the Hermes WebUI (port 8787).

## Architecture

```
hermes-control/
├── electron.cjs          # Electron main process (macOS titleBarStyle: hidden)
├── install.sh            # One-line install script (macOS/Linux)
├── install.ps1           # One-line install script (Windows)
├── server/
│   └── index.js          # Express backend, PTY bridge, file API, calendar API
├── src/
│   ├── main.js           # App entry, routing, navigation history, status polling
│   ├── api.js            # API client (status, sessions, chat, skills, etc.)
│   ├── style.css         # Liquid Glass design system (full CSS var hierarchy)
│   ├── components/       # Page components (30+ component modules)
│   ├── utils/
│   │   ├── icons.js      # SVG icon library
│   │   ├── markdown.js   # Markdown renderer
│   │   └── pomodoro.js   # Shared Pomodoro timer state
│   └── index.html        # HTML entry point
├── dist/                 # Production build output
└── package.json
```

### Design System

The Liquid Glass design language uses CSS custom properties for a complete design token hierarchy:

- **Fill System** — `--fill-primary` through `--fill-seximal` (Apple-inspired opacity scale)
- **Glass Materials** — `--glass-blur`, `--glass-bg-light/dark`, `--glass-card-*`
- **Button States** — idle, clicked, disabled, active-idle, active-disabled with proper opacities
- **Focus Ring** — Double-ring system with brand accent color
- **Typography** — System font stack with -apple-system, SF Pro, Inter, Playfair Display fallback

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript, Vite 6 |
| Desktop | Electron 41 |
| Backend | Express, http-proxy-middleware |
| Terminal | Python PTY bridge (pure Python, no dependencies) |
| Storage | Local JSON filesystem |
| Styling | CSS custom properties (design token system) |

## License

MIT
