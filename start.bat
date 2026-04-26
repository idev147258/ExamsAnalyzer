@echo off
echo Starting ExamsAnalyzer...

echo Starting FastAPI backend on http://localhost:8000...
start "ExamsAnalyzer Backend" cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting React frontend on http://localhost:5173...
start "ExamsAnalyzer Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo.
echo Both servers are running in separate windows.
