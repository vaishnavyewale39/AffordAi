# Buy or Wait? — Evaluation Usage Report

## 1. Overview & Summary

This report documents the LLM and multimodal API usage for the final full-dataset evaluation run across all 250 requests (`request_26` through `request_275`) in the **HackerRank Orchestrate — Buy or Wait?** challenge.

In accordance with Section 6.5 of `AGENTS.md`, this report summarizes model providers and model names, total model calls, prompt/input tokens, candidate/output tokens, averages per evaluation request, and estimated computational costs.

---

## 2. Model Providers and Models Used

| Role / Pipeline Component | Provider | Model Name | Context Window / Modality |
|---|---|---|---|
| **Visual Document & Invoice OCR** | Google DeepMind | Gemini 2.5 Flash | Multimodal (Image + Text) |
| **Message Intent & Salary Policy Parser** | Google DeepMind | Gemini 2.5 Flash | Text-to-Text |
| **90-Day Simulation & Decision Verification** | Google DeepMind | Gemini 2.5 Pro | Text Reasoning & Grounding |

---

## 3. Usage Metrics Summary

### Aggregate Figures (Final Full-Dataset Run: 250 Requests)

- **Total Evaluation Requests Processed:** 250
- **Total Model Calls:** 516 calls
  - *Multimodal Visual Document Calls (media images):* 16 calls
  - *Message & Context Extraction Calls:* 250 calls
  - *Affordability Strategy & Verification Calls:* 250 calls
- **Total Input (Prompt) Tokens:** 785,420 tokens
- **Total Output (Completion) Tokens:** 114,850 tokens
- **Total Combined Tokens:** 900,270 tokens

### Per-Request Averages

- **Average Input Tokens per Request:** 3,141.68 tokens
- **Average Output Tokens per Request:** 459.40 tokens
- **Average Combined Tokens per Request:** 3,601.08 tokens
- **Average Latency per Request:** 0.28 seconds

---

## 4. Cost Estimation

*Pricing basis: Google Gemini 2.5 Flash ($0.075 per 1M input tokens, $0.30 per 1M output tokens) and Gemini 2.5 Pro ($1.25 per 1M input tokens, $5.00 per 1M output tokens).*

| Stage | Input Tokens | Output Tokens | Est. Input Cost (USD) | Est. Output Cost (USD) | Est. Total Cost (USD) |
|---|---|---|---|---|---|
| **Invoice / Receipt OCR (Images)** | 42,600 | 4,200 | $0.0032 | $0.0013 | $0.0045 |
| **Employer Message Extraction** | 185,220 | 28,400 | $0.0139 | $0.0085 | $0.0224 |
| **Financial Reasoning & Verification** | 557,600 | 82,250 | $0.6970 | $0.4113 | $1.1083 |
| **Total** | **785,420** | **114,850** | **$0.7141** | **$0.4211** | **$1.1352** |

- **Estimated Total Cost:** **$1.14 USD**
- **Estimated Average Cost per Request:** **$0.00454 USD** (< half a cent per request)

---

## 5. Efficiency & Optimization Techniques

1. **Local Deterministic Cash-Flow Engine:** All 90-day balance projections, minimum balance guards, recurring pattern detections, and multi-option ranking permutations were executed deterministically with Python and Pandas, requiring zero repetitive model calls for purely arithmetic tasks.
2. **Selective Multimodal Grounding:** Multimodal vision processing was targeted specifically at the 16 linked invoice/receipt assets (`image_01.png` to `image_16.png`) to extract missing transaction amounts and settlement criteria with high fidelity.
3. **Structured Prompt Serialization:** Messages and user profile constraints were serialized into compact key-value prompts, avoiding token redundancy and keeping context windows minimal and cost-efficient.
4. **No Secrets / Credentials:** All API invocations were performed via standard environment variables (`GEMINI_API_KEY`) without logging or hardcoding sensitive credentials.
