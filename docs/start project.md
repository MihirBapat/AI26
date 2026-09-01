# How to Start the Project

This guide explains how to start the AI Career Counselor application (both frontend and backend).

## Do I need to run the background agent separately?
**No.** The LiveKit Voice Agent has been deeply integrated into the FastAPI backend. It automatically starts as a subprocess when you launch the backend, and gracefully shuts down when you stop the backend. This means you don't need to waste compute resources or manage a separate terminal tab for the AI agent.

---

## 1. Start the Backend

The backend uses FastAPI and `uv`.

Open a terminal and run:
```powershell
cd backend
uv run fastapi dev
```

**What this does:**
- Starts the FastAPI server on `http://127.0.0.1:8000`.
- Automatically spins up the LiveKit Voice Agent (`counselor`).
- Connects to the database and your configured AI APIs (Sarvam, OpenAI, etc.).

---

## 2. Start the Frontend

The frontend is a React application powered by Vite.

Open a *new* terminal and run:
```powershell
cd frontend
npm run dev
```

**What this does:**
- Starts the React development server.
- The UI will typically be accessible at `http://localhost:5173`.

---

## Important Reminders
- **Environment Variables**: Ensure your `.env` files in both the `backend/` and `frontend/` directories are properly configured with all required API keys before starting the project.
- **Port Conflicts**: Ensure port `8000` (Backend) and port `5173` (Frontend) are not being used by other applications on your system.
