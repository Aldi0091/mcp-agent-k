# Agent-K MCP Server

Minimal **Model Context Protocol (MCP)** server built with **Node.js + TypeScript**.  
Exposes a few tools and a dynamic resource over HTTP `/mcp`.

## Features

- ✅ HTTP MCP endpoint at `/mcp` (Streamable HTTP)
- 🛠 Tools:
  - `add_numbers(a, b)` – returns `{ "result": number }`
  - `echo_text(text)` – returns `{ "echoed": string, "length": number }`
- 📚 Resource:
  - `greeting://{name}` – dynamic greeting for a given name

Built using the official MCP TypeScript SDK. :contentReference[oaicite:3]{index=3}  

---

## Requirements

- Node.js 18+  
- npm (pnpm/yarn)

---

## Installation

```bash
git clone <your-repo-url> mcp-agent-k
cd mcp-agent-k

# install dependencies
npm install
