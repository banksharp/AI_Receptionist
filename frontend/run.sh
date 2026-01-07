#!/bin/bash
# Frontend startup script

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the dev server
echo "Starting frontend on http://localhost:3000"
npm run dev

