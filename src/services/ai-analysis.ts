
/**
 * Generates actionable insights for frontend errors using OpenAI.
 * This function constructs a prompt with context (browser, OS, stack) and asks the LLM for a fix.
 */
export async function generateErrorInsight(errorData: any) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `
You are an expert Frontend Debugger. Analyze the following JavaScript error and provide a concise, actionable fix.

Error Type: ${errorData.type}
Message: ${errorData.message}
Stack Trace:
${errorData.stack || 'No stack trace available'}

Context:
Browser: ${errorData.device?.browser}
OS: ${errorData.device?.os}
URL: ${errorData.url || 'Unknown'}

Please provide:
1. A 1-sentence explanation of why this happened.
2. A code block showing how to fix it.
    `.trim();

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API Error: ${err}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No insight generated.';

    } catch (error) {
        console.error('AI Analysis Failed:', error);
        throw new Error('Failed to generate insight');
    }
}
