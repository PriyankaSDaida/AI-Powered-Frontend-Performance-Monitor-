# AI-Powered Frontend Performance Monitor — System Design

## 1) Goal

Build a platform that collects real-user performance + errors from web apps, processes events at scale, and surfaces:
- **Dashboards** (Core Web Vitals, errors, slow pages, devices, regions)
- **Alerts** (spikes, regressions, anomaly detection)
- **AI Insights** (root cause hypotheses + recommended fixes)
- **Session replay / traces** (optional, privacy-aware)

## 2) Users & Personas
- **Frontend Engineers**: find regressions, debug issues fast
- **SRE/Platform**: monitor health, set alerting thresholds
- **Product/UX**: understand real-world experience trends

## 3) Functional Requirements

### Data Collection (SDK)
- **JS SDK injected into apps**
- **Captures**:
    - Web Vitals (LCP, CLS, INP, TTFB)
    - Navigation timings
    - Long tasks
    - JS errors + unhandled rejections
    - API/fetch timings (URL patterns, status codes)
    - Resource timing (large bundles, slow images)
- **Adds metadata**:
    - appId, release/version, route/page, device, browser, geo (coarse), network type

### Observability Platform
- **Project setup + API keys**
- **Dashboards**: trends, percentiles (p50/p95/p99), heatmaps
- **Drill-down**:
    - by route, release, browser, device, country, network
- **Alerts**:
    - regression vs baseline
    - anomaly detection
    - error-rate spikes

### AI Layer (Insights)
- **Detect performance regressions** by release or route
- **Suggest likely causes**:
    - "Bundle size increased 28% in release 1.2.9"
    - "INP regression correlated with long tasks from component X"
    - "Slow API endpoint /search affects LCP on /results"
- **Summarize incident in plain English**
- **Recommend fixes** + links to relevant traces/sessions

## 4) Non-Functional Requirements
- **Scale**: 10K–1M events/min (burst tolerant)
- **Low cost**: sampling + aggregation pipelines
- **Privacy & compliance**:
    - no PII by default
    - payload scrubbing
    - consent + opt-out
    - configurable allow/deny URL patterns
- **Reliability**:
    - ingestion availability 99.9%+
    - backpressure handling
- **Latency**:
    - near real-time dashboards (1–5 min)
    - alerts in under 2 minutes

## 5) High-Level Architecture

### Client Side
**Web App → JS Monitoring SDK**
- Collects events
- Buffers + batches
- Adds context tags
- Sends to ingestion endpoint over HTTPS
- Sampling rules applied at client (optional)

### Backend (Core Components)
1. **Edge Ingestion API** (CDN/Edge workers or API Gateway)
    - Validate auth keys
    - Basic schema validation
    - Rate limiting / abuse prevention
    - Enqueue raw events
2. **Event Stream / Queue**
    - Kafka / Kinesis / PubSub
    - Topic per event type (vitals/errors/network/longtask)
3. **Stream Processing**
    - Flink / Spark Streaming / Kafka Streams
    - Dedup, normalize, enrich
    - Compute rolling aggregates:
        - p50/p95/p99 by route+release+device+geo
        - error rates by release
        - endpoint latency distributions
    - Store aggregates to OLAP store
4. **Storage**
    - Raw events: object storage (S3/GCS) for reprocessing
    - Time-series/OLAP: ClickHouse / BigQuery / Druid (fast dashboard queries)
    - Search store (optional): Elasticsearch/OpenSearch for error logs
    - Metadata DB: Postgres for projects, teams, alert rules, API keys
5. **Query API**
    - GraphQL/REST for dashboards
    - AuthN/AuthZ
    - Cached hot queries (Redis)
6. **Alerting Service**
    - Evaluates alert rules on aggregates
    - Anomaly detector pipeline
    - Sends notifications (Email/Slack/PagerDuty)
7. **AI Insight Service**
    - Uses aggregates + traces + release diff metadata
    - Produces "incident cards":
        - summary, suspected cause, confidence, suggested action
    - Stores insight results and links back to dashboards
8. **Frontend Dashboard**
    - React/Next.js
    - Charts: time series, percentiles, cohort breakdowns
    - Drill-down flows + compare releases

## 6) Data Model (Key Entities)

### Event Schema (example)
- eventId (uuid)
- timestamp
- appId
- sessionId
- userId (optional hashed, privacy-controlled)
- route
- releaseVersion
- browser / device / os
- networkType (4g/5g/wifi)
- geo (country/region coarse)
- metrics:
    - vitals: LCP, CLS, INP, TTFB
    - errors: message, stackHash, type
    - api: endpointPattern, method, status, durationMs
    - longTask: durationMs

### Aggregates
**Partition keys**:
- timeBucket (1 min / 5 min)
- appId
- route
- releaseVersion
- deviceType

**Metrics**:
- p50/p95/p99 LCP/INP
- errorRate
- avg API latency + p95
- volume count (for confidence)

## 7) Sampling Strategy (Cost Control)
- **Default**: 10% sessions, 100% errors (or 100% for severe errors)
- **Dynamic sampling**:
    - increase sampling during incidents
    - lower sampling for low-traffic pages
- **Tail-based sampling for session replay**: keep "bad sessions" (slow/errors)

## 8) Anomaly Detection & Regression Logic

### Simple baseline (MVP)
- Compare current window vs:
    - last 24h same hour
    - last 7d same weekday/hour
- Alert if:
    - p95 LCP increased > X% AND traffic > threshold
    - error rate spike > threshold

### Advanced (V2)
- Seasonal time-series models
- Change-point detection per route/release
- Correlation engine:
    - "bundle size ↑" + "LCP ↑" after release deploy
    - "API latency ↑" + "LCP ↑ on pages relying on API"

## 9) Security
- Per-project API keys (rotateable)
- Signed requests (optional)
- Rate limiting per key and IP
- WAF for ingestion endpoint
- RBAC roles: Admin/Developer/Viewer
- Data retention policies per plan

## 10) Dashboard UX (Core Screens)
1. **Overview**: Core Web Vitals + errors + alerts
2. **Performance by route**: table with p95 LCP/INP + trend arrows
3. **Release comparison**: "1.2.8 vs 1.2.9"
4. **Errors**: grouped by stackHash, with impacted routes/releases
5. **API performance**: slow endpoints, status code heatmap
6. **AI Insights**: incident cards with "why we think this happened"

## 11) Tech Stack Suggestions (Pragmatic)
- **SDK**: TypeScript + tiny bundle, tree-shakeable
- **Ingestion**: API Gateway + Lambda / Cloudflare Workers
- **Streaming**: Kafka or Kinesis
- **Processing**: Flink/Kafka Streams
- **OLAP**: ClickHouse (great for percentile queries)
- **Metadata**: Postgres
- **Dashboard**: Next.js + charts (Recharts/Visx)
- **Auth**: JWT + RBAC

## 12) MVP Scope (Buildable in a Portfolio)

### Phase 1 (2–4 weeks):
- JS SDK: vitals + errors + fetch timing
- Ingestion API + queue
- Basic aggregation job (cron or streaming-lite)
- ClickHouse/BigQuery dashboards
- Basic alerts (threshold-based)
- Next.js dashboard with drill-down

### Phase 2:
- Release comparison
- Anomaly detection
- AI insight summaries (rules-first or LLM with guardrails)
- Session replay (privacy-first)
