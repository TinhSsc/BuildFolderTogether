// ai.js - Multi-Provider AI API Integration
window.TreeApp = window.TreeApp || {};

window.TreeApp.ai = {
  getProvider() {
    return localStorage.getItem('ai_provider') || 'gemini';
  },
  
  setProvider(provider) {
    localStorage.setItem('ai_provider', provider);
  },
  
  getApiKey(provider) {
    return localStorage.getItem('ai_key_' + provider) || '';
  },
  
  setApiKey(provider, key) {
    localStorage.setItem('ai_key_' + provider, key);
  },
  
  async generateTree(prompt, key, provider) {
    if (!key && provider !== 'ollama') throw new Error(window.TreeApp.i18n.t('ai_err_key_missing') || "Missing API Key");
    if (!prompt.trim()) throw new Error(window.TreeApp.i18n.t('ai_err_prompt_empty') || "Empty prompt");
    
    const systemInstruction = `You are a software architecture expert. The user will ask for a folder structure. 
You must output ONLY an ASCII directory tree representing the folder structure.
Do NOT include any explanations, greetings, or markdown code blocks (like \`\`\` or \`\`\`bash).
Use standard ASCII tree characters: ├──, └──, │, and spaces.
Folders must NOT end with a trailing slash (/). We infer folder types automatically if they have children, but you can add a trailing slash if it's empty to be safe.`;

    let text = '';

    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemInstruction } },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || window.TreeApp.i18n.t('ai_err_network') || 'Gemini API Error'); }
      const data = await response.json();
      text = data.candidates[0]?.content?.parts[0]?.text || '';
    } 
    else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'OpenAI API Error'); }
      const data = await response.json();
      text = data.choices[0]?.message?.content || '';
    }
    else if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'OpenRouter API Error'); }
      const data = await response.json();
      text = data.choices[0]?.message?.content || '';
    }
    else if (provider === 'ollama') {
      const modelName = key.trim() || 'llama3';
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          system: systemInstruction,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.1 }
        })
      });
      if (!response.ok) { throw new Error('Ollama API Error (Make sure Ollama is running and OLLAMA_ORIGINS="*" is configured)'); }
      const data = await response.json();
      text = data.response || '';
    }
    
    // Clean up potential markdown blocks if AI ignored instruction
    text = text.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();
    
    return text;
  }
};
