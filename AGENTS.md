# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GitHub Repository & Automated Git Workflow

This project is connected to GitHub repository:
- **Repository URL**: https://github.com/royalkumar304/MyRide
- **Owner**: royalkumar304
- **Repository Name**: MyRide
- **Default Branch**: main

## Workflow After Every Code Change:
1. Inspect existing project structure and relevant files before making changes.
2. Make the requested code changes cleanly; do not unnecessarily rewrite or delete existing working code.
3. Preserve all existing features unless explicitly asked to remove them.
4. Run tests, build, lint, or dev checks.
5. Review results with `git diff` to verify changes.
6. Verify `.gitignore` protects:
   - `.env`, `.env.local`, `.env.*` (except `.env.example`)
   - API keys, passwords, access tokens, credentials
   - `node_modules`
   - build/dist folders
   - generated/cache files
7. Stage only relevant project files.
8. Create a clear and meaningful Git commit describing the change.
9. Push the commit to `origin main` (https://github.com/royalkumar304/MyRide).
10. Report changes, modified files, test/build status, commit message, commit hash, and push status.

## Safety Rules:
- NEVER commit `.env`, `.env.local`, API keys, passwords, tokens, secrets, or credentials.
- NEVER commit `node_modules` or build/cache files.
- NEVER use `git push --force` unless explicitly asked.
- NEVER overwrite or delete unrelated user changes.
- Before pushing, verify remote repository is `https://github.com/royalkumar304/MyRide` and branch is `main`.
- If there is a merge conflict, auth problem, unexpected Git state, or potentially destructive operation, STOP and explain instead of forcing.
