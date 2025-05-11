
import fs from 'fs/promises';

const TARGET_URL = process.env.FASTAPI_URL;
const EXPECTED_TOKEN = process.env.SECRET_TOKEN;

export default async function handler(req, res) {
  const { url, method } = req;

  if (!['POST', 'GET'].includes(method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (method === 'GET' && url.endsWith('/relay/last-feedback')) {
    try {
      const content = await fs.readFile('/tmp/feedback_last.json', 'utf8');
      return res.status(200).json(JSON.parse(content));
    } catch {
      return res.status(404).json({ error: "No feedback found" });
    }
  }

  if (method === 'POST') {
    const { token, filename, code, run, debug } = req.body;

    if (token !== EXPECTED_TOKEN) {
      return res.status(403).json({ error: "Unauthorized token" });
    }

    if (url.endsWith('/relay/feedback')) {
      await fs.writeFile('/tmp/feedback_last.json', JSON.stringify(req.body, null, 2));
      await fs.writeFile(`/tmp/feedback_${Date.now()}.json`, JSON.stringify(req.body, null, 2));
      return res.status(200).json({ status: "Feedback saved", echo: req.body });
    }

    if (url.endsWith('/relay/execute')) {
      if (!filename || !code) {
        return res.status(400).json({ error: "Missing filename or code." });
      }

      const directive = { filename, code, run, token };

      if (debug === true) {
        await fs.writeFile(`/tmp/debug_${Date.now()}.json`, JSON.stringify(directive, null, 2));
        return res.status(200).json({ debug: "Simulasi simpan directive", directive });
      }

      try {
        const response = await fetch(TARGET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(directive)
        });

        const result = await response.json();
        await fs.writeFile(`/tmp/log_${Date.now()}.json`, JSON.stringify({ directive, result }, null, 2));
        return res.status(200).json({ status: "Executed", result });
      } catch (err) {
        return res.status(500).json({ error: "Gagal relay", detail: err.message });
      }
    }
  }

  return res.status(400).json({ error: "Unknown route" });
}
