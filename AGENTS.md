<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key changes in this project:
- `proxy.ts` replaces `middleware.ts` for route protection
- `params` and `searchParams` are `Promise<T>` — must be awaited
- `cookies()` and `headers()` from `next/headers` are async
- Prisma 7 requires a driver adapter (`@prisma/adapter-pg`)
- Chart.js v4 uses numeric font weights (not string)
- `border` config is separate from `grid.drawBorder`
<!-- END:nextjs-agent-rules -->
