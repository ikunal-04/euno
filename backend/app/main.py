import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app import db
from app.config.settings import settings
from app.routes.agent_routes import router as agent_router
from app.services.agent_service import agent_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    missing = settings.validate()
    if missing:
        logger.warning("Missing environment variables: %s", missing)
    await db.open_pool()
    yield
    await db.close_pool()
    await agent_service.close()


app = FastAPI(docs_url=None, redoc_url=None, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "euno-voice"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
