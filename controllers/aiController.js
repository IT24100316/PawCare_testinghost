const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms, petName, petSpecies } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: 'Please describe the symptoms' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'AI service is not configured. Please add GROQ_API_KEY to .env' });
    }

    const systemPrompt = `You are a professional Veterinary Triage Assistant for a pet care app called PawCare.
Your job is to help pet owners understand their pet's symptoms — NOT to diagnose.

Rules:
- Be warm, caring, and reassuring.
- Always remind the user you are an AI assistant, not a licensed veterinarian.
- Never prescribe medication.
- If the situation sounds life-threatening, urge them to visit a vet IMMEDIATELY.

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no extra text. Just raw JSON in this exact format:
{
  "possibleConditions": ["condition 1", "condition 2"],
  "urgencyLevel": 5,
  "urgencyLabel": "Medium",
  "recommendation": "a short caring recommendation",
  "homeCare": ["tip 1", "tip 2"],
  "shouldSeeVet": true,
  "vetTimeframe": "Within 24 hours"
}

urgencyLabel must be exactly one of: Low, Medium, High, Emergency`;

    const userPrompt = `Pet Name: ${petName || 'Unknown'}
Pet Type: ${petSpecies || 'Unknown'}
Owner's Description: "${symptoms}"

Analyze these symptoms and respond with ONLY the JSON object specified. No other text.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, JSON.stringify(errorData, null, 2));
      const errorMessage = errorData.error?.message || 'AI service error';
      return res.status(502).json({ message: `AI Error: ${errorMessage}` });
    }

    const data = await response.json();

    // Extract text from Groq's OpenAI-compatible response
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) {
      return res.status(502).json({ message: 'AI returned an empty response. Please try again.' });
    }

    // Strip any markdown fences if present
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
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
