**PrivacyFirewall (Local AI Privacy Shield / Local LLM DLP)**
=============================================================

⭐ **100+ stars in 24 hours** | 🍴 **7 forks** | 🔥 **Trending**

> "Solves a major security concern" — Security Professional
> "Very elegant and impressive solution" — LinkedIn User

👋 **If you're trying PrivacyFirewall, please star the repo!** 
> It helps others discover the project and motivates development.
> Takes 2 seconds → ⭐ (top right)

![PrivacyFirewall Demo](assets/PrivacyFirewall.gif)

**PrivacyFirewall** is a **local-first PII and secrets firewall** for AI tools like ChatGPT, Claude, and Gemini.It blocks risky paste events, warns as you type, and (optionally) uses a **lightweight on-device Transformer model** for deeper PII detection.

🔒 **No data ever leaves your machine.**Everything runs **locally in your browser** or through an **optional local API**.You can verify this by inspecting the network panel and reading the open-source code.

🚨 **Why This Project Exists**
------------------------------

Modern AI tools make it extremely easy to leak sensitive information:

*   Emails & phone numbers
    
*   API keys & credentials
    
*   Customer or employee data

*   IP & MAC address  
    
*   Internal logs & stack traces
    
*   Regulated personal information (PII/PHI)
    

Traditional enterprise DLP tools don’t cover **AI chat prompts**.

**PrivacyFirewall adds a zero-trust privacy shield BEFORE your text ever reaches a third-party AI system.**

### What PrivacyFirewall gives you:

*   ✋ **Human-in-the-loop protection** for accidental leaks
    
*   🔒 **100% local processing** (browser + localhost only)
    
*   ⚡ **Practical protection** (regex + optional transformer NER)
    
*   🧩 **Friendly UX** (warnings, paste-block modals, override options)
    
*   🛠 **OSS and auditable** (MV3 + FastAPI + Hugging Face stack)
    

🧠 **How It Works**
-------------------

### **Two Layers of Protection**

1.  **Lite Mode (regex-only)**Runs instantly in the extension — no setup needed.
    
2.  **AI Mode (optional, local LLM)**Uses a local FastAPI agent + transformer model for deeper detection(People, organizations, locations, contextual entities).
    

### **High-level architecture**
```mermaid
graph TD
    A[User Pastes/Types Text]:::blueNode -->|Intercept| B(Chrome Extension):::blueNode
    B -->|Regex Check| C{Contains Secrets/PII?}
    C -->|Yes & Paste| D[BLOCK & WARN]:::redNode
    C -->|Yes & Typing| E[SHOW WARNING BANNER]:::redNode
    C -->|No| F{Local Engine Online?}
    F -->|No| G[Allow]:::blueNode
    F -->|Yes| H[Python Local Engine]:::blueNode
    H -->|BERT Model| I{AI Detected PII?}
    I -->|Yes & Paste| D
    I -->|Yes & Typing| E
    I -->|No| G

    classDef blueNode fill:#2563eb,stroke:#1e40af,color:#fff
    classDef redNode fill:#dc2626,stroke:#b91c1c,color:#fff
```

*   **Regex Mode** covers secrets quickly
    
*   **AI Mode** enhances detection when the local engine is running
    
*   If the agent goes offline → extension falls back automatically
    

🚀 **Quickstart (Local Development)**
=====================================

**Prerequisites**
-----------------

*   Python **3.10+**
    
*   Chrome/Chromium/Edge
    
*   Git
    

**1) Clone**
------------
```
$ git clone https://github.com/privacyshield-ai/privacy-firewall.git

$ cd privacy-firewall

```


**2) Run the Local Engine (optional for AI Mode)**
--------------------------------------------------

```
$ cd src/engine  python -m venv .venv  

$ source .venv/bin/activate       # Windows: .venv\Scripts\activate

$ pip install --upgrade 

$ pip install -r requirements.txt

$ uvicorn main:app --host 127.0.0.1 --port 8765   

```
*   First run downloads dslim/bert-base-NER (~400MB) to ~/.cache/huggingface.
    
*   [http://127.0.0.1:8765/health](http://127.0.0.1:8765/health) → {"status":"ok"}
    

**3) Install the Chrome Extension**
-----------------------------------

1.  Visit: chrome://extensions
    
2.  Enable **Developer mode**
    
3.  Click **Load unpacked**
    
4.  Select: src/extension/
    

You now have **Lite Mode** running with regex-based detection.

**4) Try It Out**
-----------------

Go to:

*   https://chat.openai.com
    
*   https://claude.ai
    
*   https://gemini.google.com
    

Paste:

```
My email is john.doe@example.com   `

```

→ Paste is intercepted, modal appears.

Paste:

```
AKIAIOSFODNN7EXAMPLE

```
→ Detected as AWS key → blocked.

Enable AI Mode (when popup UI is ready), type:

```
 Meeting notes from Sarah Thompson at HR...   

```

→ Local transformer flags PERSON → warns you.

🔍 **Detection Coverage**
=========================

### **Regex Mode (Fast, Offline, Default)**

*   Email address
    
*   Phone number
    
*   Credit card candidate
    
*   MAC address
    
*   IPv4 address
    
*   AWS access keys
    
*   JWT tokens
    
*   Private key blocks
    
*   Generic API key / hash patterns
    
*   US SSN (basic pattern)
    

### **AI Mode (Local Transformer)**

Powered by dslim/bert-base-NER:

*   PERSON
    
*   ORGANIZATION
    
*   LOCATION
    
*   Additional named entities
    
*   Helpful for ambiguous or context-based leakage
    

📁 **Project Layout**
=====================


🧪 **Development**
==================

### **Run Detection Tests**

```
src/extension/        Chrome MV3 extension (content script, background worker, UI assets)
src/engine/           FastAPI service + transformer model wrapper
src/engine/models/    Model utilities (Hugging Face pipeline)
src/engine/tests/     Basic test harness for detection
```

### **Model & Cache Notes**

*   HuggingFace models live in ~/.cache/huggingface/
    
*   Delete this directory to force a fresh download
    

🛠️ **Future Improvements**
===========================

*   Extension settings UI (enable/disable regex/AI modes)
    
*   Add per-site allow/deny lists
    
*   Add secret-type redaction instead of full block
    
*   Package engine as a binary or desktop app
    
*   Explore transformer.js for in-browser inference.
    
*   Automated CI + browser testing
    

❗ Troubleshooting
=================

### **“Engine Offline” Banner**

*   Ensure the Python engine is running
    
*   Confirm nothing else uses port 8765
    
*   Lite mode will still block regex-based secrets
    

### **“It didn’t flag a name I typed”**

*   Ensure AI Mode is enabled + engine is online
    
*   NER models are probabilistic; long names work best
    
*   Confidence threshold is tunable in transformer\_detector.py
    

🤝 **Contributing**
===================

PRs and issues are welcome!Please include:

*   OS & browser version
    
*   Reproduction steps
    
*   Model version (if reporting AI false positives/negatives)
    

🔐 **Security & Privacy Notes**
===============================

*   **No prompts or text ever leave your machine**
    
*   Extension communicates **only** with:
    
    *   Browser local context
        
    *   Optional localhost API at 127.0.0.1:8765
        
*   No analytics, telemetry, or external logging
    
*   Review src/extension/content-script.js and DevTools → Network tabto verify behavior
    

📄 **License**
==============

MIT License.See [LICENSE](LICENSE) for full text.
