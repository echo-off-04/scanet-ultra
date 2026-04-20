# Project Guidelines

## Architecture
- The primary codebase is `scanet-next-prisma`; make all changes there unless the user explicitly asks otherwise.
- Treat `scanet-react-supabase` as a legacy reference only: inspect it to understand prior behavior, but do not modify it.
- When the same feature exists in both codebases, prefer the Next.js + Prisma implementation pattern and adapt legacy behavior into the main project.
