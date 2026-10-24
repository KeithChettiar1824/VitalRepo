# VitalRepo

> **Understand the signals. Strengthen the ecosystem.**

VitalRepo is an AI-powered open-source repository health analyzer that helps developers, maintainers, and engineering teams understand repository sustainability, detect contributor concentration vulnerabilities, and model review capacity risks.

---

## 1. Overview & Key Features

VitalRepo analyzes public GitHub repositories and distinguishes measured facts from estimates and hypothetical what-if scenarios:

- **Repository Health Score**: Multi-dimensional rule-based evaluation (0–100) scoring maintainer diversity, issue resolution velocity, pull-request responsiveness, and maintenance freshness.
- **Maintainer Concentration & Bus Factor Analysis**: Real-time calculation of top contributor shares, top 3/5 shares, and Gini inequality coefficients for activity distribution.
- **Issue Backlog Velocity**: Accurate separation of true issues from pull requests, tracking opened vs. closed issues and net backlog growth across 30, 90, or 180-day observation windows.
- **Pull Request Review Bottlenecks**: Empirical median time to first recorded human review (filtering out bot accounts like `dependabot[bot]` and `github-actions[bot]`) and pending queue age.
- **Signature Feature — Maintainer Risk Simulator**: Deterministic what-if capacity model calculating lost review throughput, at-risk pending PRs, and backup reviewer coverage if a key contributor takes temporary leave.
- **Local Open-Weight AI (Ollama + Qwen 2.5:3B)**: Evidence-grounded narrative analysis and practical recommendations running 100% locally on your machine with graceful offline fallbacks.
- **Signals Worth Your Attention & View Evidence**: Traceable findings with actual measured values, mathematical formulas, and links to verified GitHub items.
- **Exportable Reports**: Consolidated sustainability audit with one-click clipboard copying and Markdown export (`.md`).
- **Complete Demo Mode**: Curated, self-contained offline dataset (`facebook/react`) with persistent `DEMO DATA` markers to explore every feature without an API key or external network dependency.

---

## 2. Architecture & Tech Stack

```
VitalRepo/
├── backend/                  # FastAPI Application
│   ├── config.py             # Environment & defaults configuration
│   ├── models.py             # Pydantic schemas & contracts
│   ├── main.py               # API endpoints, CORS, settings, demo
│   └── services/
│       ├── github_service.py # GitHub REST API client, cache, URL validation
│       ├── metrics_calculator.py # Deterministic metric calculations
│       ├── simulation_service.py # Deterministic Risk Simulator
│       ├── ai_service.py     # Local Ollama client (Qwen 2.5)
│       └── demo_data.py      # Curated React demo dataset
├── frontend/                 # Vite + React 19 + TypeScript
│   ├── src/
│   │   ├── components/       # Layout, Navbar, Sidebar, Modals, Cards
│   │   ├── context/          # RepoContext global state provider
│   │   ├── pages/            # Overview, Health, Dependencies, Simulator, Trends, Reports, Settings
│   │   ├── services/api.ts   # Backend API communication
│   │   └── types.ts          # Shared TypeScript interfaces
├── tests/                    # Automated pytest suite
│   ├── test_api_endpoints.py
│   ├── test_github_service.py
│   ├── test_metrics_calculator.py
│   └── test_simulation_service.py
├── .env.example              # Configuration template
├── LICENSE                   # Open-source MIT License
└── README.md
```

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide React, React Router v7.
- **Backend**: Python 3.10+, FastAPI, httpx, Pydantic v2, uvicorn.
- **Data Source**: GitHub REST API v3 with in-memory caching and bounded review sampling.
- **Local AI**: Ollama running open-weight model `qwen2.5:3b`.
- **Testing**: pytest & Starlette TestClient.

---

## 3. Prerequisites

- **Python**: 3.10 or higher.
- **Node.js**: 18.0 or higher (npm 9+).
- **Ollama** *(Optional for AI explanations)*: Install from [ollama.com](https://ollama.com).

---

## 4. Quick Start & Installation

### Step 1: Clone and Set Up Environment

```bash
git clone https://github.com/your-username/vitalrepo.git
cd vitalrepo
cp .env.example .env
```

### Step 2: Set Up Backend

```bash
# Install Python dependencies
pip install fastapi uvicorn httpx pydantic pytest python-dotenv

# Run backend tests to verify environment
pytest tests
```

### Step 3: Set Up Frontend

```bash
cd frontend
npm install
npm run build
```

---

## 5. Running the Application

### Option A: Run Backend & Frontend

In terminal 1 (Backend):
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
API will be live at `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser to `http://127.0.0.1:5173/`.

---

## 6. Local Open-Weight AI Setup (Ollama)

VitalRepo integrates with open-weight models through Ollama to keep repository analysis private, without leaking repository metrics or code to remote third-party AI APIs.

### Model Name & Verified Licensing
- **Model Name**: `qwen2.5:3b` (Qwen 2.5 3-Billion parameter instruction model).
- **License**: **Apache License 2.0** (Permissive open-source license permitting commercial and private use).

### How to Run Ollama
1. Download and install Ollama from [ollama.com](https://ollama.com).
2. Start the Ollama server:
   ```bash
   ollama serve
   ```
3. In another terminal, pull and run the model:
   ```bash
   ollama run qwen2.5:3b
   ```
4. Verify readiness by opening the VitalRepo **Settings** page or checking the sidebar indicator. If Ollama is offline, all deterministic calculations, charts, and simulations continue to work seamlessly.

---

## 7. GitHub API Access & Rate Limits

- **Public Tier (Unauthenticated)**: GitHub limits unauthenticated requests to 60 requests per hour per IP address.
- **Authenticated Tier**: Add a GitHub Personal Access Token in your `.env` file or directly through the in-app **Settings** page to unlock 5,000 requests per hour.
  ```env
  GITHUB_TOKEN=ghp_your_token_here
  ```
- **Privacy & Security**: Tokens are stored exclusively in backend memory and are **never** transmitted to browser clients or persisted to disk.

---

## 8. Metric Calculation Methodology

### A. Maintainer Concentration (Bus Factor)
```
Contributor Share = (Contributor Commits / Total Counted Commits) × 100
```
- Derived from default branch commit attribution via GitHub's contributors API.
- Calculates Top 1 share, Top 3 share, and Gini Inequality Coefficient (0.0 = total equality, 1.0 = total inequality).

### B. Issue Backlog Throughput
```
Net Backlog Change = Issues Opened in Window − Issues Closed in Window
Resolution Rate = (Issues Closed in Window / Issues Opened in Window) × 100%
```
- Strict separation: Pull requests returned by GitHub's `/issues` endpoint are automatically filtered out.

### C. Pull Request Review Bottleneck
```
Review Latency = median(first_human_review_timestamp − pr_created_timestamp)
Pending PR Age = current_timestamp − pr_created_timestamp
```
- Identifies and excludes automated bot accounts (`[bot]`, `dependabot`, `github-actions`, `codecov`).
- Uses bounded review sampling (15–20 recent PR threads) to avoid exhausting API rate limits while maintaining empirical validity.

### D. Repository Sustainability Health Score (0–100)
Composed of four transparent dimensions (25 points each):
1. **Maintainer Distribution (25 pts)**: Evaluates single-contributor dominance vs. community spread.
2. **Backlog Resolution Velocity (25 pts)**: Ratio of closed to incoming issues.
3. **PR Review Responsiveness (25 pts)**: Median turnaround time to first review and pending queue age.
4. **Maintenance Freshness (25 pts)**: Cadence of recent repository pushes and releases.

---

## 9. Maintainer Risk Simulator Assumptions

The Risk Simulator models the hypothetical impact if a primary maintainer takes leave:
```
Estimated Lost Review Capacity = (Daily Review Rate) × (Scenario Days) × (Capacity Reduction Fraction)
```
### Transparent Assumptions:
1. Daily review pace is estimated from observed historical activity across the observation period.
2. Assumes incoming pull request rate remains comparable to historical averages during the scenario.
3. Secondary reviewers are identified based on actual recorded reviews in the sample.
4. **Ethical Disclaimer**: This is a hypothetical scenario based on historical activity, not a prediction about an individual or the future of a repository.

---

## 10. Automated Testing

Run the automated test suite covering URL parsing, metric formulas, Gini coefficients, bot filters, simulator math, and API routes:

```bash
# Run backend tests
pytest tests -v

# Run frontend build check
cd frontend && npm run build
```

---

## 11. License

VitalRepo is open-source software licensed under the [MIT License](LICENSE).
The default open-weight AI model (`qwen2.5:3b`) is licensed under the [Apache 2.0 License](https://github.com/QwenLM/Qwen2.5/blob/main/LICENSE).
