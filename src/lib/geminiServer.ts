import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiInstance = new GoogleGenAI({ apiKey: key });
    } else {
      console.warn('GEMINI_API_KEY is not configured or is placeholder. Using simulated AI service.');
    }
  }
  return aiInstance;
}

interface VisionResult {
  category: string;
  severity: number;
  description: string;
  reasoning: string;
}

export async function analyzeIssueImage(
  imageBufferBase64: string, 
  mimeType: string, 
  userNotes: string
): Promise<VisionResult> {
  const ai = getAI();
  if (!ai) {
    // Return high-quality simulated response if API key is not configured
    console.log('Simulating Gemini Vision analysis...');
    const lowerNotes = userNotes.toLowerCase();
    let category = 'Others';
    let severity = 3;
    let description = userNotes || 'Reported community civic issue needing attention.';
    let reasoning = 'Simulated classification based on user keywords.';

    if (lowerNotes.includes('pothole') || lowerNotes.includes('road') || lowerNotes.includes('crater')) {
      category = 'Pothole & Roads';
      severity = 4;
      description = `Large dangerous pothole reported on the main road. ${userNotes}`;
      reasoning = 'Detected Keywords related to road degradation and high traffic hazard.';
    } else if (lowerNotes.includes('leak') || lowerNotes.includes('water') || lowerNotes.includes('sewage')) {
      category = 'Water Leakage & Sewage';
      severity = 3;
      description = `Water main leakage causing overflow and flooding on street. ${userNotes}`;
      reasoning = 'Identified indicators of water supply rupture or municipal utility leakage.';
    } else if (lowerNotes.includes('garbage') || lowerNotes.includes('waste') || lowerNotes.includes('dump')) {
      category = 'Garbage & Sanitation';
      severity = 3;
      description = `Uncontrolled garbage pile and waste accumulation attracting pests. ${userNotes}`;
      reasoning = 'Visual indicators suggest sanitation neglect and public hygiene concern.';
    } else if (lowerNotes.includes('light') || lowerNotes.includes('lamp') || lowerNotes.includes('dark')) {
      category = 'Streetlight & Electricity';
      severity = 2;
      description = `Broken streetlight causing dark unsafe spots on street. ${userNotes}`;
      reasoning = 'Report details defective municipal lighting endangering pedestrian security.';
    } else if (lowerNotes.includes('encroach') || lowerNotes.includes('footpath') || lowerNotes.includes('shop')) {
      category = 'Encroachment & Footpaths';
      severity = 2;
      description = `Footpath blocked by illegal structures or vendors. ${userNotes}`;
      reasoning = 'Pedestrian pathways obstructed, forcing people onto main active roadway.';
    } else if (lowerNotes.includes('flood') || lowerNotes.includes('drain') || lowerNotes.includes('rain')) {
      category = 'Drainage & Flooding';
      severity = 5;
      description = `Severely clogged drainage system causing floodwater pooling on street. ${userNotes}`;
      reasoning = 'Heavy flood warning; drainage breakdown can compromise building structures and local safety.';
    }

    return { category, severity, description, reasoning };
  }

  try {
    const prompt = `You are CivicPulse's AI Civic Analyst for Indian cities.
Analyze this civic issue report. You are given a photo (as inline image) and notes from the reporter: "${userNotes || 'None'}"

Perform the following:
1. Classify the issue into exactly one of these categories:
   - "Pothole & Roads"
   - "Water Leakage & Sewage"
   - "Garbage & Sanitation"
   - "Streetlight & Electricity"
   - "Encroachment & Footpaths"
   - "Drainage & Flooding"
   - "Others"
2. Assign a severity score from 1 (lowest, e.g. minor trash pile) to 5 (highest, e.g. heavily flooded road or exposed live wire).
3. Generate a concise, structured English description summarizing the visual problem combined with the user's notes.
4. Give a brief 1-sentence reasoning for your classification.

Respond with ONLY a valid JSON object in this format:
{
  "category": "Pothole & Roads",
  "severity": 4,
  "description": "Large active pothole on Malleshwaram 5th cross, roughly 1.5 feet deep, causing vehicles to swerve.",
  "reasoning": "The pothole poses an active hazard on a busy thoroughfare, hence categorized as Pothole & Roads with severity 4."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBufferBase64
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
      }
    });

    const text = response.text?.trim() || '';
    const result = JSON.parse(text);
    return {
      category: result.category || 'Others',
      severity: Number(result.severity) || 3,
      description: result.description || userNotes || 'No description generated.',
      reasoning: result.reasoning || 'AI analysis completed.'
    };
  } catch (err) {
    console.error('Error during Gemini Vision analysis, falling back to simulated analysis:', err);
    // Fallback to simple matching
    return {
      category: 'Others',
      severity: 3,
      description: userNotes || 'Civic issue requiring review.',
      reasoning: 'AI service error, fell back to metadata defaults.'
    };
  }
}

export async function translateToEnglish(text: string): Promise<string> {
  const ai = getAI();
  if (!ai || !text) {
    return text;
  }

  try {
    const prompt = `You are a translator. Translate the following Indian regional text (e.g., Hindi, Kannada, Tamil, Telugu, etc.) to clear, fluent English. If it is already in English, return it exactly as-is. Return ONLY the translated English text, no extra explanation or conversational fluff.

Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
      }
    });

    return response.text?.trim() || text;
  } catch (err) {
    console.error('Translation error, returning raw text:', err);
    return text;
  }
}

export async function generatePredictiveInsights(
  wardName: string, 
  issuesData: any[]
): Promise<{ summary: string; topCategory: string; pulseScore: number }> {
  const ai = getAI();
  
  // Calculate raw stats
  const count = issuesData.length;
  
  if (count === 0) {
    return {
      summary: `No active civic issues reported in ${wardName}. The region is currently functioning at peak efficiency with a clean resolution record.`,
      topCategory: 'None',
      pulseScore: 100
    };
  }

  const resolvedCount = issuesData.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  
  // Calculate category frequencies
  const categoryFreq: { [key: string]: number } = {};
  issuesData.forEach(i => {
    categoryFreq[i.category] = (categoryFreq[i.category] || 0) + 1;
  });
  
  let topCategory = 'Others';
  let maxCount = 0;
  for (const [cat, cnt] of Object.entries(categoryFreq)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      topCategory = cat;
    }
  }

  // Calculate PulseScore™
  // Base 100, deduct points for:
  // - count of open issues (-5 per open issue)
  // - higher average severity of open issues
  const openIssues = issuesData.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  const avgSeverity = openIssues.length > 0 
    ? openIssues.reduce((sum, i) => sum + (i.severity || 3), 0) / openIssues.length 
    : 0;
  
  let pulseScore = 100;
  pulseScore -= openIssues.length * 4;
  pulseScore -= Math.round(avgSeverity * 6);
  pulseScore = Math.max(10, Math.min(100, pulseScore));

  if (!ai) {
    // Simulated prediction summaries
    let summary = `Ward analytics indicate moderate activity. Pre-emptive inspection is recommended for ${topCategory}.`;
    if (topCategory === 'Pothole & Roads') {
      summary = `Noticeable road degradation cluster in ${wardName}. Frequent complaints suggest heavy vehicle traffic is worsening cracks. Immediate surface patching recommended.`;
    } else if (topCategory === 'Drainage & Flooding') {
      summary = `Slight rainfall leads to localized water pooling. Suggests compromised local storm drainage. Regular clearing of storm-water channels is highly recommended before the high monsoon season.`;
    } else if (topCategory === 'Garbage & Sanitation') {
      summary = `Sanitation delays noted on alternate days. Residents report irregular waste disposal collection. Reorganizing morning pickup schedule and placing community bins is advised.`;
    }
    
    return { summary, topCategory, pulseScore };
  }

  try {
    const prompt = `You are CivicPulse's Urban Planning AI engine.
Analyze the following civic issue statistics for "${wardName}":
- Total reported issues: ${count}
- Open/unresolved issues: ${openIssues.length}
- Average severity of open issues: ${avgSeverity.toFixed(1)}
- Most reported category: ${topCategory} (constitutes ${maxCount} reports)

Generate a single paragraph summarizing the predictive insights for the next 30 days. Be highly specific to Indian city contexts (wards, monsoon prep, local agencies like PWD, BESCOM, BBMP, water boards). Make actionable municipal suggestions (e.g. "recommend pre-monsoon clearing of storm drains in Ward 12" or "schedule streetlight patrols during early hours"). Keep it strictly to 2-3 sentences. Do not use markdown tags or headings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
      }
    });

    return {
      summary: response.text?.trim() || `No automated summary generated. Suggest focusing on ${topCategory}.`,
      topCategory,
      pulseScore
    };
  } catch (err) {
    console.error('Error generating AI insights:', err);
    return {
      summary: `Active issue counts stand at ${openIssues.length}. Action on ${topCategory} issues is priority.`,
      topCategory,
      pulseScore
    };
  }
}
