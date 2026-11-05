/**
 * Suyaq AI Worker — API contract starter.
 * This is intentionally NOT a real RAG engine yet.
 * Add authentication, document retrieval, vector search and answer generation before production.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({ status: "ok", service: "suyaq-ai-api" }, { headers: corsHeaders });
    }

    if (url.pathname === "/api/query" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ status: "error", error: "صيغة JSON غير صحيحة." }, { status: 400, headers: corsHeaders });
      }

      const query = typeof body?.query === "string" ? body.query.trim() : "";
      if (!query) {
        return Response.json({ status: "error", error: "أرسل نصًا في الحقل query." }, { status: 400, headers: corsHeaders });
      }
      if (query.length > 2000) {
        return Response.json({ status: "error", error: "الاستعلام أطول من الحد المسموح." }, { status: 413, headers: corsHeaders });
      }

      // TODO: replace this placeholder with real retrieval + generation.
      return Response.json({
        status: "not_configured",
        error: "محرك RAG غير مربوط بعد. الواجهة جاهزة، لكن يلزم إعداد الفهرسة والاسترجاع قبل تفعيل النتائج الحقيقية.",
        retrieval: { method: "not_configured", count: 0 },
        answer: "",
        matches: []
      }, { status: 501, headers: corsHeaders });
    }

    return Response.json({ status: "ok", message: "Suyaq AI Worker is running." }, { headers: corsHeaders });
  }
};
