# AI Technical Interviewer — Prompts and AI Development Logs

**Developer Approach:** AI-Augmented Engineering
**Core Stack:** FastAPI, MongoDB, SQLite, React 19 (Vite + Tailwind v4), Deepgram SDK, Groq LLM
**AI Collaborators:** Gemini, Claude

This document records, in chronological order, the prompts used to design, build, debug, and extend the AI Technical Interviewer project, along with a summary of what each prompt produced. It is organized into phases reflecting the project's actual development sequence, spanning two AI collaborators: Gemini (initial architecture, frontend scaffolding, and early backend integration) and Claude (integration auditing, bug fixes, a Deepgram SDK migration, a chart-based delivery report feature, and a MongoDB-backed backend restructure with authentication).

---

## Phase 1: Problem Analysis and PRD Generation (Gemini)

**Prompt 1 — Problem Statement Analysis and Requirements Scoping**
"Analyze the hackathon problem statement for an AI Technical Interviewer. Break down the core objectives, target user personas, technical constraints, and required system architecture to build an adaptive real-time technical interviewer."

*Output summary:* Identified core requirements — dynamic curriculum-based question generation, real-time voice/text turn-taking, and automated post-interview candidate evaluation. Defined system components: React frontend, FastAPI session orchestration, Deepgram STT, Groq LLM reasoning engine, and SQLite telemetry persistence.

**Prompt 2 — Generating a Product Requirements Document**
"Generate a comprehensive PRD for the AI Technical Interviewer project. Include product scope, functional requirements (voice pipeline, candidate profile ingestion, evaluation report), non-functional requirements, API endpoint schema, and system flow diagrams."

*Output summary:* Drafted a PRD covering candidate ingestion, live interview turn orchestration, voice turn handling, and evaluation report generation. Specified UI flows for candidate selection, the live interview room, and the evaluation diagnostic view.

---

## Phase 2: Frontend Component Architecture and Setup (Gemini)

**Prompt 3 — Evaluating Frontend Completeness**
"Is the frontend complete, basic but working?"

*Output summary:* Verified the candidate selection flow, Web Speech streaming integration, multipart audio uploads, and the evaluation display modal. Suggested further polish such as voice-activity-detection auto-submit and speech synthesis for AI responses.

**Prompt 4 — Auditing Frontend Dependencies**
"Check my package.json dependencies. Is it fine?"

*Output summary:* Identified missing runtime dependencies and invalid package versions, and produced a corrected `package.json` with install commands for React 19, Vite, and Tailwind v4.

---

## Phase 3: Dynamic Candidate Ingestion and API Integration (Gemini)

**Prompt 5 — Connecting Backend Candidate Data**
"How to run backend, and have you taken static candidates from your own choice. Use the backend to fetch the real candidates from candidates.json."

*Output summary:* Added FastAPI endpoints to read candidate profiles from `candidates.json`, and updated the candidate selector component to fetch records dynamically on mount.

**Prompt 6 — Exporting Complete Source Files**
"Give both files complete."

*Output summary:* Delivered complete source for the backend entry point (health check, candidate listing, audio pipeline routes) and the candidate selector component (fetch, loading states, selection cards).

---

## Phase 4: Backend Environment and Speech Pipeline Debugging (Gemini)

**Prompt 7 — Auditing Virtual Environment Packages**
"Here is my pip list. Is everything ready?"

*Output summary:* Confirmed presence of core dependencies and flagged a missing package required for multipart audio file uploads.

**Prompt 8 — Fixing Deepgram SDK Import Failures**
"Uvicorn crashed with ImportError: cannot import name 'PrerecordedOptions' from 'deepgram'."

*Output summary:* Identified breaking changes in the installed Deepgram SDK version and adjusted the import structure accordingly.

**Prompt 9 — Refactoring the STT Service**
"Provide the updated stt_service.py file."

*Output summary:* Reimplemented the STT service against the SDK version in use at the time, with defensive attribute parsing for response objects.

**Prompt 10 — Resolving SDK Module Resolution Issues**
"deepgram.clients.prerecorded.v1 can't be resolved."

*Output summary:* Worked around unstable SDK import paths by passing configuration as plain dictionaries directly to the transcription call.

**Prompt 11 — Fixing Deepgram Client Instantiation**
"Uvicorn crashed with TypeError: BaseClient.__init__() takes 1 positional argument but 2 positional arguments given."

*Output summary:* Corrected the client constructor call to pass the API key as an explicit keyword argument.

---

## Phase 5: Data Normalization and UI Render Fixes (Gemini)

**Prompt 12 — Troubleshooting an Empty Candidate List**
"Nothing coming in frontend, everything static, no candidates loaded."

*Output summary:* Diagnosed file-path resolution failures when locating `candidates.json` and added a helper to search multiple candidate directories.

**Prompt 13 — Debugging Empty Backend Responses**
"Backend output shows GET /api/candidates HTTP/1.1 200 OK but terminal only shows ok response."

*Output summary:* Added backend logging to confirm the loaded record count, and updated the frontend to accept both array and object-wrapped response shapes.

**Prompt 14 — Resolving a Rendering Crash**
"Uncaught TypeError: candidates.map is not a function."

*Output summary:* Traced the crash to the backend returning a single object instead of an array, and added response normalization on the frontend.

---

## Phase 6: Telemetry and Hackathon Documentation (Gemini)

**Prompt 15 — Clarifying the Candidate Telemetry Schema**
"Can you tell me what was the meaning of attempts in the candidate.json file."

*Output summary:* Documented the telemetry schema — `attempts` records how many submissions a candidate needed to pass a given mission, feeding into first-try pass-rate signals.

**Prompt 16 — Generating an Initial Prompts and AI Logs File**
"Generate a Prompts and AI logs file where display all prompts in a sequence I used to create this project. Make it hackathon ready."

*Output summary:* Synthesized the preceding prompts into a chronological log covering problem analysis, PRD creation, architecture, debugging, and telemetry design.

---

## Phase 7: Full-Stack Integration Audit (Claude)

**Prompt 17 — Auditing Frontend/Backend Integration**
"Are the frontend and backend correctly linked up. Check all files and codes and tell if you find something wrong."

*Output summary:* Reviewed the complete backend (services, schemas, routes) and frontend (components, hooks, API client) as a set. Identified that the candidate-listing endpoint double-wrapped its response relative to the shape the rest of the backend expected, that the candidate-detail endpoint would crash with an unhandled exception on the same root cause, that the backend read `candidates.json` from a different, non-existent settings path than the rest of the application, that the CORS configuration combined a wildcard origin with credentialed requests (invalid per the CORS specification), and that the frontend read a signals field under the wrong key name.

**Prompt 18 — Applying the Fixes**
"Correct the incorrect things."

*Output summary:* Corrected the candidate-loading logic and path resolution in the backend entry point, fixed the CORS configuration to use explicit origins, centralized the frontend's API base URL into the shared API client, and corrected the mismatched field name in the candidate selector component.

---

## Phase 8: Deepgram SDK Migration (Claude)

**Prompt 19 — Diagnosing an Audio Processing Error**
"Error processing audio: 'ListenClient' object has no attribute 'rest'."

*Output summary:* Identified that the installed Deepgram Python SDK was a newer major version than the code targeted, and that the transcription call shape had changed accordingly. Rewrote the speech-to-text service against the current SDK's file-transcription method and keyword-argument-based options.

**Prompt 20 — Confirming SDK Version Compatibility**
"[pip show output confirming deepgram-sdk 7.6.0]"

*Output summary:* Verified that the installed SDK version matched the API shape used in the corrected implementation, confirming no further changes were required.

---

## Phase 9: Interview Data Model and Chart-Based Delivery Report (Claude)

**Prompt 21 — Clarifying Stored Interview Data**
"Can you tell me what all things are stored at last of interview (feedback summary, words per minute, etc.)."

*Output summary:* Documented the full set of data persisted at interview completion, distinguishing always-present fields (conversation history, structured feedback) from voice-only fields (per-turn acoustic metrics), and noted that acoustic data was not linked to specific turns and was not yet incorporated into the LLM-generated feedback.

**Prompt 22 — Evaluating Feasibility of Derived Soft-Skill Metrics**
"What all can be shown through this acoustic data. Can articulation, confidence or some soft skills things be calculated."

*Output summary:* Assessed which delivery indicators (pace, fluency, hesitation patterns) were reasonably supportable from the stored acoustic data, and flagged that literal "confidence" or "articulation" claims would overstate what pacing and pause data can actually measure, recommending composite delivery-pattern scores instead.

**Prompt 23 — Requesting a Chart-Based Detailed Report**
"I want to also display things which could be displayed in charts like confidence percentage, average speed, filler usage, follow-up question count, fluency, and some other things. It should be a detailed report."

*Output summary:* Designed and implemented a computed metrics layer, separate from the LLM-generated feedback, covering average speaking pace, filler-word rate, pause statistics, a fluency score, a delivery score, and a follow-up-versus-new-topic question breakdown derived from existing session data. Extended the response schema to carry these metrics, and built a chart-based report component (radial score gauges, a question-mix pie chart, and a curriculum-coverage bar chart) integrated into the evaluation view.

**Prompt 24 — Clarifying Persistence of Reports**
"Are these feedbacks stored permanently."

*Output summary:* Explained that completed interview data was persisted to a SQLite file with no automatic expiry, but flagged that "permanent" storage depended on the hosting platform's disk persistence, that no endpoint yet existed to browse historical reports, and that SQLite would not support a multi-instance deployment.

---

## Phase 10: MongoDB-Backed Backend Restructure with Authentication (Claude)

**Prompt 25 — Requesting a MongoDB Integration and Admin/Candidate Reporting**
"Add mongodb integration to the project. Add candidates information to it. It will also be used to store candidates feedback and reports. This will help build an admin portal to analyze all data and interviews, and let candidates see their own previous interview reports. Add a shared-password authentication system with simple middleware. Separate the feedback of the previous question from the follow-up question. Use SQLite for current-session state and MongoDB for permanent storage."

*Output summary:* Restructured the backend into a router-based architecture. Introduced MongoDB as the permanent store for candidate profiles and completed interview reports, with SQLite retained solely for in-progress session state. Implemented shared-password authentication issuing signed tokens, with dependency-based middleware distinguishing candidate and administrator access, including per-candidate ownership checks. Replaced the single-endpoint interview handler with distinct start and turn endpoints, and changed the per-turn interviewer response to structured JSON separating feedback on the previous answer from the next question. Added endpoints for a candidate's own report history and for administrator views (group-level statistics, per-candidate interview status, and individual/all report retrieval). Provided a one-time migration script to move existing candidate data into MongoDB, along with the corresponding folder structure and a setup guide.

**Prompt 26 — Locating a Referenced Data File**
"Where is curriculum.json."

*Output summary:* Clarified that the file had not been provided in the conversation and was not included in the delivered project structure, and described the expected file shape for reference.

---

## Phase 11: Dependency Verification (Claude)

**Prompt 27 — Auditing the Python Virtual Environment**
"[pip list output]. Are these fine for my project, add if anything is left and provide me requirements.txt."

*Output summary:* Identified that the web framework and the LLM and speech-to-text client libraries were absent from the listed environment despite being required by the project, and provided a corrected dependency list.

**Prompt 28 — Requesting Pinned Versions**
"Add versions also."

*Output summary:* Looked up current package release versions and cross-referenced them against the already-installed package versions, producing a fully version-pinned `requirements.txt`.

---

## Tools and AI Collaborators Used

**Gemini:** Primary collaborator for initial full-stack architecture, PRD drafting, component generation, and early-stage debugging of the candidate data pipeline and speech-to-text integration.

**Claude:** Collaborator for integration auditing and bug fixing across the existing frontend and backend, a Deepgram SDK migration, design and implementation of a computed delivery-metrics and chart-based reporting feature, and a MongoDB-backed backend restructure introducing authentication, an admin reporting surface, and candidate-facing report history.
