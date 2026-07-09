// ai.js - Multi-Provider AI API Integration
window.TreeApp = window.TreeApp || {};

window.TreeApp.ai = {
  getProvider() {
    return localStorage.getItem('ai_provider') || 'goq';
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

  // GOQ: Get all keys as array
  getGoqKeys() {
    const raw = localStorage.getItem('ai_key_goq') || '';
    return raw.split('\n').map(k => k.trim()).filter(k => k.length > 20);
  },

  setGoqKeys(raw) {
    localStorage.setItem('ai_key_goq', raw);
  },

  systemInstruction: `You are a software architecture expert. The user will ask for a folder structure. 
You must output ONLY an ASCII directory tree representing the folder structure.
Do NOT include any explanations, greetings, or markdown code blocks (like \`\`\` or \`\`\`bash).
Use standard ASCII tree characters: ├──, └──, │, and spaces.
Folders must NOT end with a trailing slash (/). We infer folder types automatically if they have children, but you can add a trailing slash if it's empty to be safe.`,

  // Single Gemini call with a specific key
  async _callGemini(prompt, key) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: this.systemInstruction } },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      const status = response.status;
      const msg = err.error?.message || 'Gemini API Error';
      // Quota errors: 429 or message contains RESOURCE_EXHAUSTED
      const isQuota = status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
      const error = new Error(msg);
      error.isQuota = isQuota;
      throw error;
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  },

  // GOQ: Try each key, fallback on quota error
  async _generateGoq(prompt, onStatus) {
    const keys = this.getGoqKeys();
    if (keys.length === 0) throw new Error('GOQ: No API keys configured. Open ⚙️ API Key Settings and paste your Gemini keys.');

    for (let i = 0; i < keys.length; i++) {
      try {
        if (onStatus) onStatus(`GOQ: Trying key ${i + 1}/${keys.length}...`);
        const text = await this._callGemini(prompt, keys[i]);
        return text;
      } catch (err) {
        if (err.isQuota && i < keys.length - 1) {
          // Quota exceeded, try next key
          continue;
        }
        // Last key or non-quota error
        if (err.isQuota) {
          throw new Error(`GOQ: All ${keys.length} key(s) have exceeded quota. Try again later.`);
        }
        throw err;
      }
    }
  },

  async generateTree(prompt, key, provider, onStatus) {
    if (provider !== 'goq' && !key && provider !== 'ollama') throw new Error(window.TreeApp.i18n.t('ai_err_key_missing') || "Missing API Key");
    if (!prompt.trim()) throw new Error(window.TreeApp.i18n.t('ai_err_prompt_empty') || "Empty prompt");
    
    let text = '';

    if (provider === 'goq') {
      text = await this._generateGoq(prompt, onStatus);
    }
    else if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: this.systemInstruction } },
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
            { role: "system", content: this.systemInstruction },
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
            { role: "system", content: this.systemInstruction },
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
          system: this.systemInstruction,
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
