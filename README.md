<p align="center">
  <img src="assets/pw128.png" alt="PrivacyFirewall Logo" width="100">
</p>

<h1 align="center">PrivacyFirewall</h1>

👋 **If you're trying PrivacyFirewall, please star the repo!** 
> It helps others discover the project and motivates development.
> Takes 2 seconds → ⭐ (top right)

<p align="center">
  <strong>Stop AI Data Leaks Before They Happen</strong><br>
  100% Local • Zero Server • Full Control
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/AI-ONNX%20Runtime-FF6F00?logo=onnx&logoColor=white" alt="ONNX Runtime">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-34A853" alt="100% Local">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">
</p>

<p align="center">
  <img src="assets/PrivacyFirewall.gif" alt="PrivacyFirewall Demo" width="700">
</p>

---

## The Problem

Every day, sensitive data gets leaked to AI chatbots:

- 📧 **Customer emails** pasted into ChatGPT for summarization
- 🔑 **API keys** accidentally included in code snippets
- 👤 **Employee names** shared in meeting notes
- 💳 **Credit card numbers** copied from support tickets
- 🏠 **Home addresses** in shipping data analysis

**Traditional DLP tools don't protect AI chat interfaces.** PrivacyFirewall does.

---

## The Solution

**PrivacyFirewall** intercepts sensitive data *before* it reaches AI tools — running **entirely in your browser** with no external servers.

### Key Features

| Feature | Description |
|---------|-------------|
| 🛡️ **Paste Protection** | Blocks sensitive pastes with a confirmation modal |
| ⌨️ **Real-time Typing Detection** | Warns as you type sensitive data |
| 🧠 **Local AI Detection** | BERT NER model runs in-browser via ONNX/WASM |
| ⚙️ **Configurable Rules** | Enable/disable specific PII types, set block vs warn |
| 🌐 **Site Management** | Protect ChatGPT, Claude, Gemini, Copilot, and more |
| 🔒 **Zero Data Transmission** | Nothing ever leaves your machine |

---

## How It Works

```mermaid
graph TD
    A[User Pastes/Types Text] -->|Intercept| B(Content Script)
    B -->|Layer 1| C{Regex Scan}
    C -->|Match Found| D{Block or Warn?}
    D -->|Block| E[🛑 Show Modal]
    D -->|Warn| F[⚠️ Show Banner]
    C -->|No Match| G{AI Engine Ready?}
    G -->|Yes| H[ONNX Model in Browser]
    H -->|Entities Found| D
    H -->|Clean| I[✅ Allow]
    G -->|No| I

    style E fill:#dc2626,color:#fff
    style F fill:#f59e0b,color:#fff
    style I fill:#22c55e,color:#fff
```

### Two-Layer Protection

1. **Instant Regex Layer** — Catches obvious patterns (emails, credit cards, API keys) in milliseconds
2. **AI Layer** — BERT Named Entity Recognition detects names, organizations, and locations that regex misses

Both layers run **100% locally** in your browser. No Python server. No API calls. No cloud.

---

## Quick Start

### Option 1: Download & Install (No Code Required)

> **Perfect for trying it out** — takes 30 seconds

1. **Download** the latest release:

   [![Download Extension](https://img.shields.io/badge/Download-Latest%20Release-4285F4?style=for-the-badge&logo=googlechrome)](https://github.com/ArnabKar/privacy-firewall/releases/latest/download/privacyfirewall-extension.zip)

2. **Unzip** the downloaded file

3. **Install in Chrome**:
   - Go to `chrome://extensions`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the unzipped folder

4. **Done!** Visit [ChatGPT](https://chat.openai.com) and try pasting:
   ```
   Contact john.doe@company.com or call 555-123-4567
   ```

---

### Option 2: Build from Source (For Developers)

<details>
<summary>Click to expand developer instructions</summary>

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArnabKar/privacy-firewall.git
   cd privacy-firewall
   ```

2. **Build the extension**
   ```bash
   cd src/extension
   npm install
   node build.js
   ```

3. **Load in Chrome**
   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `src/extension/dist` folder

</details>

---

## Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="assets/modal-screenshot.png" alt="Block Modal"><br>
      <strong>Paste Blocked</strong><br>
      <em>Sensitive data detected with highlighting</em>
    </td>
    <td align="center" width="50%">
      <img src="assets/banner-screenshot.png" alt="Warning Banner"><br>
      <strong>Typing Warning</strong><br>
      <em>Real-time detection as you type</em>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="assets/popup-screenshot.png" alt="Popup"><br>
      <strong>Extension Popup</strong><br>
      <em>Quick status and settings access</em>
    </td>
    <td align="center">
      <img src="assets/settings-screenshot.png" alt="Settings"><br>
      <strong>Settings Page</strong><br>
      <em>Full control over detection rules</em>
    </td>
  </tr>
</table>

---

## Detection Coverage

### Regex Detection (Instant)

| Type | Examples |
|------|----------|
| 📧 Email | `user@example.com` |
| 📱 Phone | `555-123-4567`, `+1 (555) 123-4567` |
| 💳 Credit Card | `4532-0151-1283-0366` |
| 🔢 SSN | `123-45-6789` |
| 🔑 AWS Keys | `AKIAIOSFODNN7EXAMPLE` |
| 🎫 JWT Tokens | `eyJhbGciOiJIUzI1NiJ9...` |
| 🔐 Private Keys | `-----BEGIN RSA PRIVATE KEY-----` |
| 🌐 IP Addresses | `192.168.1.1` |
| 📍 MAC Addresses | `00:1A:2B:3C:4D:5E` |
| 🏠 US Addresses | `123 Main St, New York, NY 10001` |

### AI Detection (BERT NER)

| Entity Type | Examples |
|-------------|----------|
| 👤 PERSON | `John Smith`, `Dr. Sarah Thompson` |
| 🏢 ORGANIZATION | `Acme Corp`, `Goldman Sachs` |
| 📍 LOCATION | `New York`, `Silicon Valley` |

---

## Configuration

### Settings Page

Access via the extension popup → **Open Settings**

- **PII Rules**: Enable/disable detection for each type
- **Block vs Warn**: Choose blocking modal or warning banner
- **Protected Sites**: Manage which AI tools are protected
- **AI Confidence**: Adjust sensitivity threshold (0-100%)
- **Behavior**: Toggle real-time typing detection

### Protected Sites (Default)

- ✅ ChatGPT (`chat.openai.com`, `chatgpt.com`)
- ✅ Claude (`claude.ai`)
- ✅ Gemini (`gemini.google.com`)
- ✅ Copilot (`copilot.microsoft.com`)
- ✅ Poe (`poe.com`)
- ✅ Grok (`grok.com`)
- ✅ DeepSeek (`chat.deepseek.com`)

---

## Architecture

```
src/extension/
├── manifest.json          # Chrome MV3 manifest
├── background.js          # Service worker (message routing)
├── content-script.js      # Page injection (paste/typing interception)
├── offscreen.js           # AI model execution environment
├── offscreen.html         # Offscreen document container
├── lib/
│   └── transformer-detector.js  # BERT NER model wrapper
├── modules/
│   ├── config.js          # Regex patterns & constants
│   ├── scanner.js         # Detection orchestration
│   ├── settings.js        # Chrome storage management
│   ├── event-handlers.js  # Paste & input handlers
│   └── ui/
│       ├── modal.js       # Blocking modal component
│       ├── banner.js      # Warning banner component
│       └── styles.js      # Shadow DOM styles
└── ui/
    ├── popup.html/js/css  # Extension popup
    └── settings.html/js/css # Settings page
```

### Technology Stack

- **Extension**: Chrome Manifest V3, ES Modules
- **AI Runtime**: ONNX Runtime Web (WASM)
- **Model**: `Xenova/bert-base-NER-uncased` via Hugging Face Transformers.js
- **UI Isolation**: Shadow DOM (no CSS conflicts with host pages)

---

## Privacy & Security

### What We DON'T Do

- ❌ Send data to external servers
- ❌ Log or store your text
- ❌ Use analytics or telemetry
- ❌ Make any network requests (except model download on first run)

### What We DO

- ✅ Process everything locally in your browser
- ✅ Cache the AI model locally after first download
- ✅ Store settings in Chrome's encrypted sync storage
- ✅ Provide fully auditable open-source code

**Verify yourself**: Open DevTools → Network tab. You'll see zero outbound requests during detection.

---

## Development

### Build

```bash
cd src/extension
npm install
node build.js
```

### Run Tests

```bash
node tests/content-script.test.js
```

### Project Requirements

- Chrome 120+ (for Offscreen Documents API)
- Node.js 18+ (for building)

---

## Troubleshooting

### "AI Model Loading..." stays forever

- Check DevTools console for errors
- The model (~50MB) downloads on first run — may take a minute on slow connections
- Try clearing extension data and reloading

### Extension doesn't detect on some sites

- Check if the site is in your protected sites list
- Some sites use iframes — detection may be limited
- Open an issue with the site URL

### False positives/negatives

- Adjust AI confidence threshold in settings
- Some patterns (like short names) may not be detected
- Report edge cases as issues

---

## Roadmap

- [ ] Firefox/Safari support
- [ ] Custom regex patterns via settings
- [ ] Redaction mode (replace vs block)
- [ ] Export/import settings
- [ ] Keyboard shortcuts
- [ ] Enterprise policy support

---

## Contributing

PRs welcome! Please include:

- Browser version
- Steps to reproduce
- Expected vs actual behavior

---

## License

MIT License — see [LICENSE](LICENSE)

---

<p align="center">
  <strong>Built for privacy. Runs locally. Open source.</strong><br>
  <a href="https://github.com/ArnabKar/privacy-firewall/issues">Report Bug</a> •
  <a href="https://github.com/ArnabKar/privacy-firewall/issues">Request Feature</a>
</p>
