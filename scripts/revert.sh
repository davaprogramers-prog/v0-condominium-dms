#!/bin/bash
set -e

echo "[v0] Starting git revert to commit 19a252f..."
cd /vercel/share/v0-project

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "[v0] Current branch: $CURRENT_BRANCH"

# Check git status
echo "[v0] Git status before revert:"
git status

# Reset to the verified commit 19a252f
echo "[v0] Resetting to commit 19a252f..."
git reset --hard 19a252f

echo "[v0] Git status after revert:"
git status

echo "[v0] Revert completed successfully!"
echo "[v0] Commit 19a252f restored"
