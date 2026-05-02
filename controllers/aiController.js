const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms, petName, petSpecies } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: 'Please describe the symptoms' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'AI service is not configured. Please add GEMINI_API_KEY to .env' });
    }

    const systemPrompt = `You are a professional Veterinary Triage Assistant for a pet care app called PawCare. 
Your job is to help pet owners understand their pet's symptoms — NOT to diagnose.

Rules:
- Be warm, caring, and reassuring.
- Always remind the user you are an AI assistant, not a licensed veterinarian.
- Never prescribe medication.
- If the situation sounds life-threatening, urge them to visit a vet IMMEDIATELY.

Respond in this EXACT JSON format (no markdown, no code fences, just raw JSON):
{
  "possibleConditions": ["condition 1", "condition 2"],
  "urgencyLevel": <number from 1 to 10>,
  "urgencyLabel": "<Low|Medium|High|Emergency>",
  "recommendation": "<a short, caring recommendation>",
  "homeCare": ["tip 1", "tip 2"],
  "shouldSeeVet": <true or false>,
  "vetTimeframe": "<e.g. Within 24 hours, Within a week, Immediately, Not urgent>"
}`;

    const userPrompt = `Pet Name: ${petName || 'Unknown'}
Pet Type: ${petSpecies || 'Unknown'}
Owner's Description: "${symptoms}"

Analyze these symptoms and respond with the JSON format specified.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('--- GEMINI API ERROR ---');
      console.error('Status:', response.status);
      console.error('Error Details:', JSON.stringify(errorData, null, 2));
      console.error('------------------------');
      
      const errorMessage = errorData.error?.message || 'AI service error';
      return res.status(502).json({ message: `AI Error: ${errorMessage}` });
    }


    const data = await response.json();

    // Extract the text from Gemini's response
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ message: 'AI returned an empty response. Please try again.' });
    }

    // Parse the JSON from the AI response (strip any markdown fences if present)
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return the raw text as a fallback
      parsed = {
        possibleConditions: ['Unable to parse structured response'],
        urgencyLevel: 5,
        urgencyLabel: 'Medium',
        recommendation: rawText,
        homeCare: [],
        shouldSeeVet: true,
        vetTimeframe: 'When convenient',
      };
    }

    res.status(200).json({
      success: true,
      analysis: parsed,
      disclaimer: 'This AI analysis is for informational purposes only and is not a substitute for professional veterinary advice. If your pet is in distress, please visit a veterinarian immediately.',
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze symptoms. Please try again.' });
  }
};

module.exports = { analyzeSymptoms };
