<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- **Layout / early inline JS:** do not use `next/script` with inline `{string}` children in `layout.tsx` — React 19 warns. Use `<head><script dangerouslySetInnerHTML={…} /></head>`; see `.cursor/rules/no-next-script-inline-in-layout.mdc`.

<!-- END:nextjs-agent-rules -->
