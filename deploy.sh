#!/bin/bash
# Deploy script - saves, commits, and pushes to GitHub (triggers Vercel deployment)

read -p "Enter commit message: " message

if [ -z "$message" ]; then
  message="Update project files"
fi

git add -A
git commit -m "$message"
git push

echo "✓ Deployed! Your changes will be live in a few seconds on Vercel."
