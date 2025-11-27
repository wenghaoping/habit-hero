<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Pd29pCNsU9ZE39grpUuIkRpFh7GNuASx

## Run Locally

**Prerequisites:**  Node.js 20+, pnpm

1. Install pnpm (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional)

4. Start the backend server:
   ```bash
   pnpm run server:dev
   ```

5. In another terminal, start the frontend:
   ```bash
   pnpm run dev
   ```

6. Open http://localhost:3000 in your browser

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Backend**: Express, SQLite3
- **Package Manager**: pnpm
