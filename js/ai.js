// ai.js - Gemini API Integration
window.TreeApp = window.TreeApp || {};

window.TreeApp.ai = {
  getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  },
  
  setApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
  },
  
  async generateTree(prompt, apiKey) {
    if (!apiKey) throw new Error(window.TreeApp.i18n.t('ai_err_key_missing') || "Missing API Key");
    if (!prompt.trim()) throw new Error(window.TreeApp.i18n.t('ai_err_prompt_empty') || "Empty prompt");
    
    const systemInstruction = `You are a software architecture expert. The user will ask for a folder structure. 
You must output ONLY an ASCII directory tree representing the folder structure.
Do NOT include any explanations, greetings, or markdown code blocks (like \`\`\` or \`\`\`bash).
Use standard ASCII tree characters: ├──, └──, │, and spaces.
Folders must NOT end with a trailing slash (/). We infer folder types automatically if they have children, but you can add a trailing slash if it's empty to be safe.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || window.TreeApp.i18n.t('ai_err_network') || 'Failed to connect to Gemini API');
    }

    const data = await response.json();
    let text = data.candidates[0]?.content?.parts[0]?.text || '';
    
    // Clean up potential markdown blocks if AI ignored instruction
    text = text.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();
    
    return text;
  }
};
