
export async function ttsSpeak(req, res) {
  const { apiUrl, text, voice, num_step, first_chunk_words, min_chunk_words, batch_size, no_warmup } = req.body;

  if (!apiUrl || !text || !voice) {
    return res.status(400).json({ error: "Missing required fields: apiUrl, text, voice" });
  }

  const ttsEndpoint = `${apiUrl.replace(/\/$/, "")}/tts`;
  const payload = { text, voice, num_step, first_chunk_words, min_chunk_words, batch_size, no_warmup };

  try {
    const params = new URLSearchParams();
    params.append("text", payload.text);
    params.append("voice", payload.voice);
    if (payload.num_step != null) params.append("num_step", String(payload.num_step));
    if (payload.first_chunk_words != null) params.append("first_chunk_words", String(payload.first_chunk_words));
    if (payload.min_chunk_words != null) params.append("min_chunk_words", String(payload.min_chunk_words));
    if (payload.batch_size != null) params.append("batch_size", String(payload.batch_size));
    if (payload.no_warmup != null) params.append("no_warmup", String(payload.no_warmup));

    const response = await fetch(ttsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ngrok-skip-browser-warning": "1",
      },
      body: params.toString(),
    });

    console.log("[TTS] Response status:", response.status);
    console.log("[TTS] Response headers:");
    response.headers.forEach((val, key) => console.log(`  ${key}: ${val}`));

    if (!response.ok) {
      const errText = await response.text();
      console.error("[TTS] Error body:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = Buffer.from(await response.arrayBuffer());

    console.log("[TTS] Response content-type:", contentType);
    console.log("[TTS] Response body size:", buffer.length, "bytes");

    res.set("Content-Type", contentType || "audio/wav");
    res.send(buffer);

  } catch (err) {
    console.error("[TTS] Fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function ttsTestFormats(req, res) {
  const { apiUrl, text, voice } = req.body;
  const ttsEndpoint = `${apiUrl.replace(/\/$/, "")}/tts`;
  const results = [];

  const payload = { text: text || "Đây là bài test.", voice: voice || "nu-nhe-nhang", num_step: 8 };

  try {
    console.log("\n[TTS-TEST] 1. Trying JSON POST...");
    const r = await fetch(ttsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
      body: JSON.stringify(payload),
    });
    const buf = Buffer.from(await r.arrayBuffer());
    results.push({ format: "JSON POST", status: r.status, contentType: r.headers.get("content-type"), size: buf.length });
    console.log("[TTS-TEST] 1. JSON POST →", r.status, buf.length, "bytes");
  } catch (e) {
    results.push({ format: "JSON POST", error: e.message });
  }

  try {
    console.log("[TTS-TEST] 2. Trying URL-encoded POST...");
    const params = new URLSearchParams(payload);
    const r = await fetch(ttsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "ngrok-skip-browser-warning": "1" },
      body: params.toString(),
    });
    const buf = Buffer.from(await r.arrayBuffer());
    results.push({ format: "URL-encoded POST", status: r.status, contentType: r.headers.get("content-type"), size: buf.length });
    console.log("[TTS-TEST] 2. URL-encoded POST →", r.status, buf.length, "bytes");
  } catch (e) {
    results.push({ format: "URL-encoded POST", error: e.message });
  }

  // ── 3. Query params GET ───────────────────────────────────
  try {
    console.log("[TTS-TEST] 3. Trying GET with query params...");
    const params = new URLSearchParams(payload);
    const r = await fetch(`${ttsEndpoint}?${params}`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    });
    const buf = Buffer.from(await r.arrayBuffer());
    results.push({ format: "GET query params", status: r.status, contentType: r.headers.get("content-type"), size: buf.length });
    console.log("[TTS-TEST] 3. GET query params →", r.status, buf.length, "bytes");
  } catch (e) {
    results.push({ format: "GET query params", error: e.message });
  }

  try {
    console.log("[TTS-TEST] 4. Trying POST with query params...");
    const params = new URLSearchParams(payload);
    const r = await fetch(`${ttsEndpoint}?${params}`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "1" },
    });
    const buf = Buffer.from(await r.arrayBuffer());
    results.push({ format: "POST query params", status: r.status, contentType: r.headers.get("content-type"), size: buf.length });
    console.log("[TTS-TEST] 4. POST query params →", r.status, buf.length, "bytes");
  } catch (e) {
    results.push({ format: "POST query params", error: e.message });
  }

  console.log("\n[TTS-TEST] ══════ RESULTS ══════");
  results.forEach((r) => console.log(`  ${r.format}: ${r.status || "ERR"} — ${r.size || 0} bytes ${r.error || ""}`));
  console.log("");

  res.json(results);
}

// GET /api/tts/voices
export async function ttsVoices(req, res) {
  const { apiUrl } = req.query;
  if (!apiUrl) return res.status(400).json({ error: "Missing apiUrl query param" });

  try {
    const r = await fetch(`${apiUrl.replace(/\/$/, "")}/voices-list`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("[TTS] Voices error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
