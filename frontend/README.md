# Signal — AI Technical Interviewer (Frontend)

A React + Vite + Tailwind v4 frontend for the Interview-Prep-App backend (FastAPI + Mongo).

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if your API isn't on 127.0.0.1:8000
npm run dev
```

The backend's CORS config (`backend/app/main.py`) only allows `http://localhost:5173` /
`http://127.0.0.1:5173` by default — that's Vite's default dev port, so no change is needed
unless you run on a different port.

## Structure

```
src/
  lib/
    api.js          — single fetch client for every backend route (auth/candidates/interview/reports/admin)
    authStore.js     — zustand store (persisted) holding { token, role, candidateId }
  hooks/
    useSpeechToText.js — Web Speech API (live captions) + MediaRecorder (audio upload) combined hook
  components/
    Navbar.jsx              — public marketing navbar (Admin login + Start interview)
    ProtectedRoute.jsx      — role-gated route wrapper
    AdminSidebar.jsx        — candidate directory + search/filter, used on /admin
    CandidateSidebar.jsx    — My Profile / My Reports nav, used on /candidate
    RoundTimer.jsx          — circular session clock (center of the interview room)
    DeliveryReportCharts.jsx — gauges + bars for InterviewMetricsSchema
    StatCard.jsx, Spinner.jsx
  pages/
    HomePage.jsx            — landing page ("Start interview" replaces "Request demo")
    AdminLoginPage.jsx      — admin-only login (password, no candidateId)
    CandidateLoginPage.jsx  — candidate picker + shared candidate password
    AdminDashboardPage.jsx  — /admin — cohort overview when nothing selected, else candidate detail + reports
    CandidatePage.jsx       — /candidate — My Profile / My Reports tabs
    InterviewPage.jsx       — /interview — round timer, AI transcript (left), candidate input (right)
    ResultPage.jsx          — /report — full evaluation report (interview completion + past reports)
```

## Auth flow

- **Admin**: Navbar → "Admin login" → `POST /api/auth/login {password}` → `/admin`.
- **Candidate**: "Start interview" (or "Candidate login") → pick a profile from
  `GET /api/candidates` → `POST /api/auth/login {password, candidateId}` → redirected back to
  wherever they were headed (defaults to `/candidate`).

Both flows store a bearer token in `authStore` (persisted to `localStorage` under the key
`signal-auth`); `lib/api.js` attaches it automatically to authenticated calls.

## Interview flow

`InterviewPage` opens a session (`POST /api/interview/start`) and then loops on
`POST /api/interview/turn` (text) or `POST /api/interview/audio` (voice, via `useSpeechToText`'s
`MediaRecorder`). Each response's `previousAnswerFeedback` and `isFollowUp` are rendered as
distinct cards from the next question. When `done: true`, the returned `feedback` is handed to
`/report` via router state — the same page a candidate reaches from "My Reports".
