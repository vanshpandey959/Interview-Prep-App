from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, candidates, interview, reports, admin

app = FastAPI(
    title="AI Technical Interviewer API",
    description="Interview orchestration with SQLite live-session state and MongoDB permanent storage.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"] + allow_credentials=True is invalid per the CORS spec.
    # List your actual dev/prod frontend origins here.
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(interview.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "online", "service": "AI Technical Interviewer API"}
