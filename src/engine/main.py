from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal

from detection import analyze_text

app = FastAPI(title="PrivacyShield Engine", version="0.1.0")

# Add CORS middleware to allow Chrome extension to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (safe for local use)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str


class Entity(BaseModel):
    type: str
    value: str


class AnalyzeResponse(BaseModel):
    pii_detected: bool
    secrets_detected: bool
    entities: List[Entity]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    """
    Analyze text for PII and secrets.
    This is a thin wrapper around the detection logic.
    """
    result = analyze_text(request.text)

    # Ensure the result matches the expected schema
    return AnalyzeResponse(
        pii_detected=result.get("pii_detected", False),
        secrets_detected=result.get("secrets_detected", False),
        entities=[
            Entity(type=e["type"], value=e["value"])
            for e in result.get("entities", [])
        ],
    )
