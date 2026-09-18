#!/bin/bash
echo "==================================================="
echo "  Starting Apex Software Platform (Full Stack)"
echo "==================================================="

# Start Backend
(cd apex-backend && npm start) &
BACKEND_PID=$!

sleep 2

# Start Frontend
(cd apex-app && npx expo start) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
