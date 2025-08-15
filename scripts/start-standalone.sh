#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Error: Node.js not found. Please install Node.js 18+."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies."
        exit 1
    fi
fi

if [ ! -d "dist" ]; then
    npm run build
    if [ $? -ne 0 ]; then
        echo "Error: Build failed."
        exit 1
    fi
fi

node scripts/validate-config.js
if [ $? -ne 0 ]; then
    echo "Error: Configuration validation failed."
    exit 1
fi

exec node dist/src/mcp-server.js