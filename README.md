# Threaded LLM Chat Interface

A sophisticated chat application with advanced thread management capabilities, designed for complex conversation workflows with AI assistance. Built with Next.js, React, and OpenRouter API.

## Features

- **Hierarchical Threads**: Support for nested conversation threads
- **Message Forking**: Ability to create new threads from existing messages
- **Context Management**: Include/exclude messages and threads from context
- **Thread Visibility**: Control which threads are visible in the interface
- **Modern UI**: Built with Tailwind CSS and custom components
- **AI Integration**: Powered by OpenRouter API with multiple model support

## Getting Started

### 1. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Site configuration for OpenRouter rankings
SITE_URL=http://localhost:3000
SITE_NAME=Threaded LLM Chat Interface
```

**Get your OpenRouter API key:**
1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key to your `.env.local` file

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

### AI Models

The application is configured to use the `deepseek/deepseek-r1:free` model by default. You can modify the model in `app/api/chat/route.ts`:

```typescript
model: "deepseek/deepseek-r1:free", // Change this to any OpenRouter model
```

### Available Models

- `deepseek/deepseek-r1:free` - Free tier model
- `meta-llama/llama-3.2-3b-instruct:free` - Alternative free model
- `anthropic/claude-3.5-sonnet` - Premium model (requires credits)
- `openai/gpt-4o` - Premium model (requires credits)

## Architecture

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
