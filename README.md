# Mercator

Interactive single-route historical atlas. One world map; click a story pin to enter
a story of 5 events drawn as dashed voyage/campaign paths.

## Develop
- `yarn install`
- `yarn dev` -> http://localhost:3000

## Test
- `yarn test` (unit + content validation)

## Build
- `yarn build` (fully static; ready for Vercel)

## Deploy (Vercel)
- Ensure Vercel is configured for this repo (`vercel login` and `vercel link`, or connect in dashboard)
- Deploy from this project root with `yarn dlx vercel --prod`
- Re-verify menu -> story -> menu flow and deep links on the production URL

## Content
Stories live in `content/stories/*.json`, validated by zod at build time
(`lib/content/schema.ts`). Images live in `public/stories/<storyId>/`.
