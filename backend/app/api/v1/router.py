from fastapi import APIRouter

from app.api.v1 import (
    agent, alerts, analysis, auth, buildings, chat, craters, disaster,
    export, flood, mesh, opendata, population, processing, projects,
    system, terrain, translate, validation,
)

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(processing.router)
api_router.include_router(terrain.router)
api_router.include_router(mesh.router)
api_router.include_router(analysis.router)
api_router.include_router(validation.router)
api_router.include_router(export.router)
api_router.include_router(flood.router)
api_router.include_router(craters.router)
api_router.include_router(buildings.router)
api_router.include_router(alerts.router)
api_router.include_router(chat.router)
api_router.include_router(agent.router)
api_router.include_router(population.router)
api_router.include_router(disaster.router)
api_router.include_router(translate.router)
api_router.include_router(opendata.router)
