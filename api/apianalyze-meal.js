export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided.' });
  }

  try {
    const prompt = `
Analyze this meal photo. Provide a realistic estimate of the food items, portion sizes, total calories, and macronutrients (protein, carbs, fat in grams).
Classify it into one category: "breakfast", "lunch", "dinner", or "snacks".

You MUST reply ONLY with valid JSON using this exact schema, without markdown formatting or code blocks:
{
  "name": "Short meal summary (e.g., Grilled Salmon & Brown Rice)",
  "calories": 550,
  "protein": 42,
  "carbs": 45,
  "fat": 15,
  "category": "dinner"
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Gemini API call failed' });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error processing image' });
  }
}