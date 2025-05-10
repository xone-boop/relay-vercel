export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.body.token !== process.env.SECRET_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const response = await fetch("https://your-ngrok-url.ngrok-free.app/execute-gpt-directive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to relay request", detail: error.toString() });
  }
}
