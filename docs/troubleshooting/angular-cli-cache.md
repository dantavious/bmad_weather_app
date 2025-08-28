# Troubleshooting Guide

This guide provides solutions to common issues that may arise during development.

## Angular CLI Caching Issues

**Problem:**

The Angular CLI may sometimes fail to pick up configuration changes in `angular.json`, leading to unexpected errors such as `NG0203` even after the configuration has been corrected. This is often due to a stale cache.

**Solution:**

To resolve this, you need to clear the Angular CLI's cache. Run the following commands from the root of the project:

```bash
npm cache clean --force --prefix frontend
rm -rf frontend/.angular/cache
```

This will force the CLI to re-evaluate the configuration and should resolve the issue.
