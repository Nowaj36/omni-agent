# OmniAgent

**Hybrid Multi-Capability AI Agent**
*Local vLLM + Fireworks Intelligence*

OmniAgent is a production-ready hybrid AI agent that intelligently routes tasks between a local vLLM server running on AMD GPUs and Fireworks AI. By executing lightweight tasks locally and sending only complex reasoning tasks to the cloud, OmniAgent reduces inference cost, lowers latency, and improves reliability.

---

## Features

* 🚀 Hybrid AI provider (Local vLLM + Fireworks AI)
* 🧠 Intelligent task routing
* 🔄 Automatic provider fallback
* ✅ Confidence-aware verification
* 📦 Structured JSON output
* 🐳 Docker support for the backend
* ⚡ AMD GPU acceleration with ROCm + vLLM
* 🧪 300+ automated tests

---

## Supported AI Capabilities

* Question Answering
* Summarization
* Sentiment Classification
* Named Entity Recognition
* Mathematical Reasoning
* Code Generation
* Code Debugging
* General Reasoning

---

## Tech Stack

### Backend

* NestJS
* TypeScript
* Zod
* Fireworks AI
* vLLM
* AMD ROCm

### Frontend

* Next.js
* React
* TypeScript

---

## Project Structure

```text
omni-agent/
├── apps/
│   ├── api/              # NestJS Backend
│   └── web/              # Next.js Frontend
├── input/
├── output/
├── Dockerfile
├── package.json
└── README.md
```

---

# Prerequisites

* Node.js 22+
* pnpm
* Docker (optional)
* AMD GPU (for local vLLM)
* Fireworks AI API Key

---

# Installation

Clone the repository.

```bash
git clone <repository-url>
cd omni-agent
```

Install dependencies.

```bash
pnpm install
```

Copy the environment file.

```bash
cp .env.example .env
```

Update the required environment variables.

---

# Run the Backend

```bash
pnpm --filter api dev
```

---

# Run the Frontend

```bash
pnpm --filter web dev
```

The frontend is available at:

```
http://localhost:3000
```

---

# Run Both

Open two terminals.

Terminal 1

```bash
pnpm --filter api dev
```

Terminal 2

```bash
pnpm --filter web dev
```

---

# Docker

Currently, **Docker support is available for the backend (API) only.**

The frontend (`apps/web`) is **not containerized** at this time.

Build the Docker image:

```bash
docker build -t omni-agent .
```

Run the container:

```bash
docker run --env-file .env omni-agent
```

---

# Environment Variables

OmniAgent uses separate environment files for the backend and frontend.

Backend (apps/api/.env)

Copy the example file and configure your backend environment variables.

cp apps/api/.env.example apps/api/.env

Example variables:

```env
AGENT_MODE=server

# ============================================================================
# Batch File Paths only work in AGENT_MODE=batch mode. If you are running the agent in server mode, you can ignore these.
# ============================================================================
# Local Example
# Windows:
# BATCH_INPUT_PATH=C:\path\to\your\project\input\tasks.json
# BATCH_OUTPUT_PATH=C:\path\to\your\project\output\results.json
#
# Linux/macOS:
# BATCH_INPUT_PATH=/path/to/your/project/input\tasks.json
# BATCH_OUTPUT_PATH=/path/to/your/project/output\results.json
# ============================================================================

# Default values (Docker)
BATCH_INPUT_PATH=/repo/input/tasks.json
BATCH_OUTPUT_PATH=/repo/output/results.json

LLM_PROVIDER=hybrid

LOCAL_LLM_BASE_URL=http://<YOUR_AMD_VM_IP>:8000/v1

FIREWORKS_API_KEY=your_fireworks_api_key

FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1

FIREWORKS_MODELS=accounts/fireworks/models/kimi-k2p7-code

ALLOWED_MODELS=google/gemma-3-27b-it
```

For local development, update the batch input and output paths to match your local project location.

## Frontend (`apps/web/.env.local`)

Create a local environment file for the frontend.

```bash
cp apps/web/.env.example apps/web/.env.local
```

Example configuration:

```env
# Base URL of the OmniAgent NestJS API (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Repository link displayed in the UI
NEXT_PUBLIC_GITHUB_URL=https://github.com/<your-github-username>/omni-agent
```

Replace `NEXT_PUBLIC_API_URL` with the URL of your deployed backend if you are not running it locally.


---

# Architecture

```
User Input
      │
      ▼
 Task Router
      │
      ▼
 Hybrid Provider
 ├── Local vLLM (AMD GPU)
 └── Fireworks AI
      │
      ▼
Verification Layer
      │
      ▼
Structured JSON Output
```

---

# Why OmniAgent?

Instead of sending every request to a cloud model, OmniAgent automatically decides the best execution path.

* Lower cloud cost
* Faster response time
* Local-first execution
* Automatic fallback
* Production-ready architecture

---

# AMD Integration

OmniAgent uses:

* AMD GPU
* ROCm
* vLLM

Local inference runs on AMD hardware while complex reasoning is handled by Fireworks AI.

---

# Testing

Run all tests.

```bash
pnpm test
```

---

# Build

```bash
pnpm build
```

---

# License

MIT License.
