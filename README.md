# Hermes Control Center

A modern control interface for the Hermes AI Agent system, built with high-end aesthetics and real-time monitoring.

## Features
- **Control Center**: Instant start/stop for the Hermes core service.
- **Activity Monitor**: Real-time CPU and Memory telemetry.
- **Command Line**: Integrated PTY-driven terminal with silent resizing.
- **Agent Hub**: One-click access to Mimo, Kimi, DeepSeek, and Gemini.
- **Customization**: Support for multiple themes (Pantone-inspired) and typography settings.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3 (for PTY bridge)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the backend:
   ```bash
   node server/index.js
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Technical Architecture
- **Frontend**: Vite + Vanilla JavaScript (Reactive Functional Components).
- **Backend**: Express + Python PTY Bridge.
- **Design**: Premium glassmorphism with Pantone-inspired color palettes.

---
*Based on hermes-ui. Version v1.0.5-Preview.*
