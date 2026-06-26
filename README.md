# ReactNativeTest

A React Native + Next.js project with a custom `.pyx` component pipeline that compiles Python-syntax JSX expressions via [Transcrypt](https://transcrypt.org/).

## Prerequisites

- [Node.js](https://nodejs.org/) (via [nvm](https://github.com/nvm-sh/nvm) or similar)
- [uv](https://docs.astral.sh/uv/) — Python version and package manager

Install uv:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Setup

```bash
npm run setup
```

This installs Python 3.12, Transcrypt, and all Node dependencies for the root project, scripts package, and web package.

## Running the App

### Web (Next.js)

```bash
npm run next
```

Builds `.pyx` components for web, starts the Next.js dev server, and watches for changes.

### Native (Expo)

```bash
npm run native
```

### Specific platforms

```bash
npm run android
npm run ios
```

## Project Structure

```
/
├── components/          # Shared components (.pyx, .jsx, .html.jsx)
├── app/                 # Expo Router app directory
├── web/                 # Next.js web app
│   └── app/             # Next.js app directory
├── scripts/             # .pyx build pipeline (TypeScript/Node)
│   └── src/
│       ├── cli.ts       # Build CLI entry point
│       ├── builders/    # Per-file-type build logic
│       └── stages/      # Pipeline stages (Transcrypt, JSX, etc.)
├── setup.sh             # One-shot setup script
└── package.json
```

## The .pyx Build Pipeline

`.pyx` files are JSX components with Python-syntax expressions inside `{}`. The build pipeline:

1. Extracts `{}` expressions from JSX
2. Compiles them through Transcrypt
3. Outputs standard `.jsx` files consumable by both Expo and Next.js

Build manually:

```bash
# All components, both targets
npm run build:pyx:all

# Web target only
npm run build:pyx:web

# Single file
npm run build:pyx -- components/LandingPage.pyx
```

Watch mode runs automatically as part of `npm run next` / `npm run native`.
