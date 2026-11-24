// Vite dev-server middleware: POST /api/chat -> Google Gemini (free) or Claude, with live weather / air tools.
// The API key stays on the server (read from .env), never shipped to the browser.
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are AirBuddy, the friendly assistant inside the AirAware air-quality app (India focused).
Answer ANY question the user asks — general knowledge, weather, health, the app, anything — clearly and briefly (2–5 short sentences unless they ask for more).
For current weather, temperature or air quality of any place, ALWAYS call the get_weather_and_air tool instead of guessing.
India AQI follows CPCB (Good, Satisfactory, Moderate, Poor, Very Poor, Severe). US AQI follows EPA and is stricter.
The app has an India AQI / US AQI switch next to the AirBuddy character on the Live Monitoring page.
Use plain text, no markdown headings. For health questions give general advice and suggest a doctor for anything serious.`;

const TOOLS = [
  {
    name: 'get_weather_and_air',
    description: 'Get current temperature, weather and air quality (PM2.5, PM10, US AQI) for any city or place in the world.',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', description: 'City or place name, e.g. "Kota" or "Delhi"' } },
      required: ['place'],
      additionalProperties: false,
    },
    strict: true,
  },
];

async function getWeatherAndAir(place) {
  const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`)).json();
  const loc = geo.results?.[0];
  if (!loc) return { error: `Place "${place}" not found` };
  const { latitude: la, longitude: lo } = loc;
  const [wx, aq] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`).then((r) => r.json()),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${la}&longitude=${lo}&current=pm2_5,pm10,us_aqi`).then((r) => r.json()),
  ]);
  return {
    place: [loc.name, loc.admin1, loc.country].filter(Boolean).join(', '),
    weather: wx.current, today: wx.daily, units: wx.current_units,
    air: aq.current,
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

async function chat(history, context) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const messages = history
    .filter((m) => m.text)
    .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
  while (messages.length && messages[0].role !== 'user') messages.shift();

  const system = `${SYSTEM}\n\nCurrent app context: ${JSON.stringify(context)}`;
  for (let i = 0; i < 4; i++) {
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      tools: TOOLS,
      messages,
    });
    if (res.stop_reason === 'refusal') return "Sorry, I can't help with that one. Try asking something else!";
    if (res.stop_reason !== 'tool_use') {
      return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    }
    messages.push({ role: 'assistant', content: res.content });
    const results = await Promise.all(res.content.filter((b) => b.type === 'tool_use').map(async (b) => {
      try {
        return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(await getWeatherAndAir(b.input.place)) };
      } catch (e) {
        return { type: 'tool_result', tool_use_id: b.id, content: `Lookup failed: ${e.message}`, is_error: true };
      }
    }));
    messages.push({ role: 'user', content: results });
  }
  return 'Sorry, that took too many steps. Please try again.';
}

// ---- Google Gemini (free tier: get a key at https://aistudio.google.com/apikey) ----
const GEMINI_MODEL = 'gemini-2.5-flash';
class GeminiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function chatGemini(history, context) {
  const contents = history
    .filter((m) => m.text)
    .map((m) => ({ role: m.from === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
  while (contents.length && contents[0].role !== 'user') contents.shift();
  const body = {
    systemInstruction: { parts: [{ text: `${SYSTEM}

Current app context: ${JSON.stringify(context)}` }] },
    tools: [{ functionDeclarations: [{
      name: 'get_weather_and_air',
      description: TOOLS[0].description,
      parameters: { type: 'OBJECT', properties: { place: { type: 'STRING', description: 'City or place name, e.g. "Kota" or "Delhi"' } }, required: ['place'] },
    }] }],
    contents,
  };
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok) throw new GeminiError(r.status, json.error?.message || 'Gemini request failed');
    const parts = json.candidates?.[0]?.content?.parts || [];
    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) {
      const text = parts.map((p) => p.text || '').join('').trim();
      return text || "Sorry, I can't help with that one. Try asking something else!";
    }
    contents.push({ role: 'model', parts });
    contents.push({ role: 'user', parts: await Promise.all(calls.map(async ({ functionCall: fc }) => {
      let response;
      try { response = await getWeatherAndAir(fc.args?.place || ''); } catch (e) { response = { error: `Lookup failed: ${e.message}` }; }
      return { functionResponse: { name: fc.name, response } };
    })) });
  }
  return 'Sorry, that took too many steps. Please try again.';
}

export async function handleChat(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
  const useGemini = !!process.env.GEMINI_API_KEY;
  if (!useGemini && !process.env.ANTHROPIC_API_KEY) { res.statusCode = 503; res.end(JSON.stringify({ error: 'no_key' })); return; }
  try {
    const { history = [], context = {} } = await readBody(req);
    const reply = useGemini ? await chatGemini(history.slice(-20), context) : await chat(history.slice(-20), context);
    res.end(JSON.stringify({ reply }));
  } catch (e) {
    if (e instanceof GeminiError && (e.status === 400 || e.status === 401 || e.status === 403)) { console.error('[airbuddy-chat] Gemini:', e.message); res.statusCode = 401; res.end(JSON.stringify({ error: 'bad_key' })); return; }
    if (e instanceof GeminiError && e.status === 429) { res.statusCode = 429; res.end(JSON.stringify({ error: 'rate_limited' })); return; }
    if (e instanceof Anthropic.AuthenticationError) { res.statusCode = 401; res.end(JSON.stringify({ error: 'bad_key' })); return; }
    if (e instanceof Anthropic.RateLimitError) { res.statusCode = 429; res.end(JSON.stringify({ error: 'rate_limited' })); return; }
    console.error('[airbuddy-chat]', e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'server_error' }));
  }
}

export default function chatPlugin(env) {
  return {
    name: 'airbuddy-chat',
    configureServer(server) {
      if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
      if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      server.middlewares.use('/api/chat', handleChat);
    },
  };
}
