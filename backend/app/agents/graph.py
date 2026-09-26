"""
LangGraph multi-agent orchestration: Routing -> Reconstruction Tool-Calling
-> Disaster-Assessment -> Verification. Each node is a small, inspectable
function; the reasoning call (turning tool output into a natural-language
answer) is pluggable - it defaults to the free Hugging Face Inference API
you already have configured, so this runs with zero additional API keys.
Swap in GPT-4o / Claude / Qwen-2.5-VL by replacing `_call_reasoning_model()`.
"""
from typing import TypedDict, Optional

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.agents import tools
from app.services import chatbot as chatbot_service

settings = get_settings()


class AgentState(TypedDict):
    message: str
    project_id: Optional[str]
    db: Session
    intent: Optional[str]
    tool_result: Optional[dict]
    response: Optional[str]


def _classify_intent(message: str) -> str:
    """Routing Agent - lightweight keyword routing (no LLM round-trip needed
    just to pick a branch; keeps latency down before the reasoning call)."""
    m = message.lower()
    if "flood" in m or "water level" in m or "submerge" in m:
        return "flood_simulation"
    if "risk" in m or "collapse" in m or "crater" in m or "population" in m or "summary" in m:
        return "risk_assessment"
    if "official data" in m or "government data" in m or "rainfall" in m or "data.gov" in m or "open data" in m:
        return "open_data"
    return "general_query"


def routing_node(state: AgentState) -> AgentState:
    state["intent"] = _classify_intent(state["message"])
    return state


def reconstruction_tool_node(state: AgentState) -> AgentState:
    """Reconstruction Tool-Calling Agent - fetches the project's current
    analysis context so downstream nodes/the reasoning model have grounded data."""
    if not state.get("project_id"):
        state["tool_result"] = {"error": "No project selected."}
        return state
    context = tools.get_project_context(state["db"], state["project_id"])
    state["tool_result"] = context
    return state


def disaster_assessment_node(state: AgentState) -> AgentState:
    """Disaster-Assessment Agent - runs the specific tool for the routed intent."""
    context = state.get("tool_result") or {}
    if state["intent"] == "flood_simulation":
        import re
        match = re.search(r"(\d+(\.\d+)?)\s*m", state["message"])
        water_level = float(match.group(1)) if match else context.get("max_elevation", 10) * 0.5
        result = tools.simulate_flood(state["db"], state["project_id"], water_level)
        state["tool_result"] = {**context, "flood_result": result}
    elif state["intent"] == "risk_assessment":
        state["tool_result"] = {**context, "risk_summary": tools.summarize_risk(context)}
    elif state["intent"] == "open_data":
        state["tool_result"] = {**context, "open_data": tools.fetch_open_data()}
    return state


def verification_node(state: AgentState) -> AgentState:
    """Verification Agent - grounds the final answer in the tool output
    (via the free HF chatbot model) rather than letting the model free-associate."""
    context_str = str(state.get("tool_result", {}))
    prompt_context = f"Tool output for this query: {context_str}"
    state["response"] = chatbot_service.ask(state["message"], prompt_context)
    return state


def build_graph():
    """Builds and compiles the LangGraph StateGraph. Import langgraph lazily
    so the rest of the backend works even before it's installed."""
    from langgraph.graph import StateGraph, END

    graph = StateGraph(AgentState)
    graph.add_node("routing", routing_node)
    graph.add_node("reconstruction", reconstruction_tool_node)
    graph.add_node("assessment", disaster_assessment_node)
    graph.add_node("verification", verification_node)

    graph.set_entry_point("routing")
    graph.add_edge("routing", "reconstruction")
    graph.add_edge("reconstruction", "assessment")
    graph.add_edge("assessment", "verification")
    graph.add_edge("verification", END)

    return graph.compile()


def run_agent(db: Session, message: str, project_id: str | None) -> dict:
    """Entry point used by the API routes. Falls back to the plain chatbot
    service (no graph) if langgraph isn't installed, so /agent/chat never
    hard-fails just because that dependency is missing."""
    try:
        app_graph = build_graph()
        result = app_graph.invoke({
            "message": message, "project_id": project_id, "db": db,
            "intent": None, "tool_result": None, "response": None,
        })
        return {"response": result["response"], "intent": result["intent"]}
    except ImportError:
        context = tools.get_project_context(db, project_id) if project_id else {}
        return {
            "response": chatbot_service.ask(message, str(context)),
            "intent": "general_query (langgraph not installed - direct fallback used)",
        }
