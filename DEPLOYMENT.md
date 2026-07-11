# Deploying to Vercel

This app is ready to deploy as a public Vercel project. The frontend is served from `public/`, and `/api/chat` runs as a Vercel Node function through `api/index.js`.

## Required Environment Variables

Add these in Vercel under Project Settings -> Environment Variables:

```text
IBM_API_KEY
IBM_PROJECT_ID
IBM_MODEL_ID
IBM_CHAT_URL
IBM_IAM_URL
```

Use `.env.example` as the template. Do not commit the real `.env` file.

## Vercel Settings

- Framework Preset: Other
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: `npm install`

## Deploy

```bash
npm install
npx vercel
npx vercel --prod
```

You can also import the GitHub repository in the Vercel dashboard. Make sure the project is public in GitHub if you want the source public too; the deployed website itself will be public by default.
