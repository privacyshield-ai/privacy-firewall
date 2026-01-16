# PrivacyFirewall Copilot Instructions

## Architecture Overview

This is a **Chrome Extension (Manifest V3)** that detects and blocks sensitive PII in AI chat interfaces. It uses a **two-layer detection system**:

1. **Regex Layer** – Instant pattern matching in content script (emails, credit cards, SSNs, API keys)
2. **AI Layer** – BERT NER model (`Xenova/bert-base-NER-uncased`) via `@huggingface/transformers` for names/orgs/locations

### Critical Component Architecture

```
content-script.js     → Runs on protected sites, handles paste/typing events
    ↓ message
background.js         → Service worker, routes AI requests to offscreen document
    ↓ message
offscreen.js          → Runs ONNX/WASM model (required because service workers can't do WASM+XMLHttpRequest)
    ↓ import
lib/transformer-detector.js → HuggingFace pipeline initialization and entity detection
```

**Why offscreen document?** Chrome's service worker cannot run WASM with XMLHttpRequest. The offscreen document provides full Web API access for the AI model.

## Build & Development

```bash
cd src/extension
npm install
node build.js        # Builds to dist/ folder
```

Then load `src/extension/dist` as unpacked extension in `chrome://extensions`.

The build uses **esbuild** to bundle ES modules and copies WASM files from `onnxruntime-web`.

## Key Patterns

### Module Organization

- [modules/config.js](src/extension/modules/config.js) – All constants, regex patterns, DOM IDs, theme colors
- [modules/settings-defaults.js](src/extension/modules/settings-defaults.js) – PII rule definitions with `detect`/`block`/`severity`
- [modules/scanner.js](src/extension/modules/scanner.js) – Orchestrates regex + AI scanning with settings filtering
- [modules/event-handlers.js](src/extension/modules/event-handlers.js) – `PasteHandler` and `InputHandler` classes
- [modules/ui/](src/extension/modules/ui) – Shadow DOM-isolated UI components (modal, banner)

### Settings-Driven Detection

PII rules are configurable per-type. When adding new detection:
```javascript
// In settings-defaults.js
NEW_TYPE: {
  id: 'NEW_TYPE',
  detect: true,    // Enable scanning
  block: true,     // true=modal, false=banner warning
  severity: 'high',
  detectionMethod: 'regex' | 'ai' | 'both'
}

// In scanner.js, map pattern types to rule IDs
const PATTERN_TO_RULE_MAP = { 'new_pattern': 'NEW_TYPE' };
```

### Message Passing

Inter-component communication uses typed messages defined in `MESSAGE_TYPES` (config.js):
- `SCAN_TEXT` – Content script → Background → Offscreen for AI scan
- `ENGINE_STATUS` / `GET_ENGINE_STATUS` – Track AI model readiness
- `SETTINGS_UPDATED` – Broadcast settings changes to content scripts

### UI Isolation

All UI (modal, banner) uses **Shadow DOM** to prevent CSS conflicts with host pages:
```javascript
this.host = document.createElement("div");
this.shadow = this.host.attachShadow({ mode: "open" });
```

## Testing

```bash
cd src/extension
node tests/content-script.test.js   # Regex pattern tests
```

Tests use a minimal custom framework (no external dependencies). Add test cases following existing patterns in the test file.

## Extension-Specific Constraints

- **No dynamic imports** – WASM threading disabled (`env.backends.onnx.wasm.numThreads = 1`)
- **Model loads on demand** – First AI scan triggers model download (~20MB cached in browser)
- **Content script must be lightweight** – Never import `transformer-detector.js` in content script
- **Protected sites list** in manifest.json `content_scripts.matches` and `settings.protectedSites`
