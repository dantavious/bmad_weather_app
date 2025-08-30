# Troubleshooting Angular Build and Dependency Issues

This guide provides solutions to common issues that may arise during development, particularly those related to build caches and dependency conflicts.

## Persistent NG0203 Injection Context Errors

**Symptom:**

You encounter a persistent `RuntimeError: NG0203: inject() must be called from an injection context` during application bootstrap (`main.ts`). This error continues to appear even after verifying that:
1.  Your `app.config.ts` has the correct providers (e.g., `provideAnimations`, `importProvidersFrom` for CDK modules).
2.  Your `angular.json` has the correct build settings (e.g., `"preserveSymlinks": true`).
3.  You have restarted the `ng serve` development server.

**Cause:**

This issue is often caused by a corrupted `node_modules` directory or a deeply-seated stale cache within the npm and Angular CLI build systems. In these cases, simply restarting the server is not enough to clear the corrupted state.

**Solution: Clean Reinstallation**

The most definitive way to resolve this is to perform a full, clean reinstallation of all frontend dependencies. This process removes any possibility of stale or corrupted artifacts.

Run the following commands from the project root:

```bash
# 1. Remove installed packages and the lock file from the frontend project
rm -rf frontend/node_modules frontend/package-lock.json

# 2. (Optional but recommended) Remove the Angular CLI's cache directory
rm -rf frontend/.angular

# 3. Force clear the global npm cache
npm cache clean --force

# 4. Reinstall all frontend dependencies from scratch
npm install --prefix frontend
```

After these steps, restart the development server (`ng serve`). The application should now build with a fresh environment, resolving the error.
