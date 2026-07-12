# 🤖 OmniAgent

> A production-ready AI Agent orchestration platform with local-first LLM execution, intelligent verification, and automatic fallback.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![NestJS](https://img.shields.io/badge/NestJS-red)
![Docker](https://img.shields.io/badge/Docker-2496ED)
![Gemma](https://img.shields.io/badge/Google-Gemma%203-green)

---

## 🚀 Overview

OmniAgent is a modular AI Agent platform designed to execute multiple AI capabilities through a unified orchestration pipeline.

Instead of directly calling a cloud model for every request, OmniAgent follows a **Local-First Hybrid Architecture**:

1. Try the local LLM (Google Gemma 3 via vLLM)
2. Verify the generated response
3. Retry if necessary
4. Automatically fall back to Fireworks AI only when required

This approach reduces latency, lowers inference costs, and increases system reliability.

---

# ✨ Features

- ✅ Multi-Agent Task Orchestration
- ✅ Local LLM (Google Gemma 3 27B)
- ✅ Hybrid Local → Fireworks Fallback
- ✅ Automatic Verification
- ✅ Intelligent Retry Loop
- ✅ JSON Output Validation
- ✅ Docker Support
- ✅ Modular Capability Architecture
- ✅ Production Ready Logging
- ✅ Type-safe NestJS Backend

---

# 🧠 Supported AI Capabilities

| Capability | Status |
|------------|---------|
| Question Answering | ✅ |
| Classification | ✅ |
| Summarization | ✅ |
| Named Entity Recognition | ✅ |
| Debug Assistance | ✅ |
| Code Generation | ✅ |
| Logical Reasoning | ✅ |
| Verification & Retry | ✅ |

---

# 🏗 Architecture

```text
                tasks.json
                     │
                     ▼
              Batch Runner
                     │
                     ▼
          Agent Orchestrator
                     │
                     ▼
          Capability Router
                     │
                     ▼
          Hybrid LLM Provider
             │             │
             │             │
             ▼             ▼
      Local Gemma      Fireworks AI
        (Primary)       (Fallback)
             │
             ▼
      Verification Engine
             │
             ▼
        Retry (if needed)
             │
             ▼
         results.json
```

---

# ⚙ Tech Stack

### Backend

- NestJS
- TypeScript
- Node.js

### AI

- Google Gemma 3 27B
- vLLM
- Fireworks AI

### Infrastructure

- Docker
- Docker Compose

### Validation

- Zod

### Logging

- Pino

### Testing

- Jest

---

# 📂 Project Structure

```
apps/
 ├── api/
 │
 ├── capabilities/
 │
 ├── infrastructure/
 │
 ├── orchestrator/
 │
 └── providers/

input/
output/
docker/
```

---

# 🔄 Execution Flow

```
Receive Task

↓

Route Capability

↓

Generate Response

↓

Verify Response

↓

Retry (if required)

↓

Return Final Answer
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Nowaj36/omni-agent.git

cd omni-agent
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Configure Environment

Create a `.env` file.

Example:

```env
AGENT_MODE=batch

# ============================================================================
# Batch File Paths
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

---

# ▶ Run Development Server

```bash
pnpm dev
```

---

## 🐳 Run with Docker

### Build the image

```bash
docker build -t omni-agent .
```

### Run the container

```bash
docker run \
  --env-file .env \
  -v $(pwd)/input:/repo/input \
  -v $(pwd)/output:/repo/output \
  omni-agent
```

---

# 🧪 Run Tests

```bash
pnpm test
```

---

# 📥 Example Input

```json
[
  {
    "task_id": "1",
    "input": "What is the capital of Australia?"
  }
]
```

---

# 📤 Example Output

```json
[
  {
    "task_id": "1",
    "answer": "The capital of Australia is Canberra."
  }
]
```

---

# 💡 Why OmniAgent?

Unlike traditional AI applications that depend entirely on cloud APIs, OmniAgent is designed around a **Local-First Hybrid Architecture**.

Benefits include:

- Lower inference cost
- Faster response time
- Reduced cloud dependency
- Automatic verification
- Intelligent fallback
- Modular capability design

---

# 🔮 Future Improvements

- Multi-model routing
- MCP Integration
- RAG Support
- Tool Calling
- Memory Layer
- Streaming Responses
- Agent Collaboration


---

# 📄 License

MIT License

---

## 👨‍💻 Author

**Nowaj Chowdhury**

GitHub: https://github.com/Nowaj36

---

⭐ If you found this project useful, consider giving it a star!