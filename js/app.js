// app.js - Main Application Entry Point
window.TreeApp = window.TreeApp || {};

(function() {
  const { state, elements, utils, treeLogic, history, render, search, room, zipLogic, storage } = window.TreeApp;

  // Bind UI Events
  document.getElementById('addRootFolder').onclick = () => { history.mutate(() => treeLogic.addNode(state.tree, 'folder')); };
  document.getElementById('addRootFile').onclick = () => { history.mutate(() => treeLogic.addNode(state.tree, 'file')); };
  
  document.getElementById('exportBtn').onclick = () => {
    const lines = zipLogic.buildTextTree(state.tree, '');
    elements.exportOutput.value = lines.join('\n') || window.TreeApp.i18n.t('zip_empty');
    elements.exportBox.style.display = 'block';
    elements.exportOutput.select();
  };
  
  document.getElementById('zipBtn').onclick = () => zipLogic.exportZip();

  const zipFileInput = document.getElementById('zipFileInput');
  document.getElementById('uploadZipBtn').onclick = () => zipFileInput.click();
  
  zipFileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (state.tree.length > 0 && !confirm(window.TreeApp.i18n.t('zip_replace_confirm'))) { zipFileInput.value = ''; return; }
    if (typeof JSZip === 'undefined') { utils.showStatus(window.TreeApp.i18n.t('zip_no_lib')); zipFileInput.value = ''; return; }
    try {
      utils.showStatus(window.TreeApp.i18n.t('zip_reading'));
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const newTree = await zipLogic.buildTreeFromZip(zip);
      history.mutate(() => { state.tree.length = 0; newTree.forEach(n => state.tree.push(n)); });
      utils.showStatus(window.TreeApp.i18n.t('zip_imported'));
    } catch (err) {
      console.error(err);
      utils.showStatus(window.TreeApp.i18n.t('zip_err'));
    }
    zipFileInput.value = '';
  };

  document.getElementById('undoBtn').onclick = () => history.undo();
  document.getElementById('redoBtn').onclick = () => history.redo();
  document.getElementById('cutBtn').onclick = () => treeLogic.cutSelected();
  document.getElementById('copyBtn').onclick = () => treeLogic.copySelected();
  document.getElementById('pasteBtn').onclick = () => treeLogic.pasteClipboard();
  document.getElementById('duplicateBtn').onclick = () => treeLogic.duplicateSelected();
  
  document.getElementById('collapseAllBtn').onclick = () => { state.collapsedIds = new Set(treeLogic.collectFolderIds(state.tree, [])); render.renderTree(); };
  document.getElementById('expandAllBtn').onclick = () => { state.collapsedIds.clear(); render.renderTree(); };

  const searchInput = document.getElementById('searchInput');
  searchInput.oninput = () => search.performSearch(searchInput.value);
  document.getElementById('searchClearBtn').onclick = () => { searchInput.value = ''; state.matchIds.clear(); render.renderTree(); };

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const isEditable = tag === 'input' || tag === 'textarea';
    
    // Escape: close panels / deselect
    if (e.key === 'Escape') {
      if (document.getElementById('aiBox').style.display !== 'none') {
        document.getElementById('aiBox').style.display = 'none'; return;
      }
      if (document.getElementById('importBox').style.display !== 'none') {
        document.getElementById('importBox').style.display = 'none'; return;
      }
      if (state.selectedIds.size > 0) {
        state.selectedIds.clear(); render.renderTree(); return;
      }
      return;
    }

    // Delete selected items using Delete or Backspace key
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditable && state.selectedIds.size > 0) {
      e.preventDefault();
      treeLogic.deleteSelected();
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    const key = e.key.toLowerCase();

    // Ctrl+A: Select all nodes
    if (key === 'a' && !isEditable) {
      e.preventDefault();
      function collectAllIds(nodes, acc) {
        nodes.forEach(n => { acc.add(n.id); if (n.children) collectAllIds(n.children, acc); });
      }
      collectAllIds(state.tree, state.selectedIds);
      render.renderTree();
      return;
    }

    // Ctrl+F: Focus search bar
    if (key === 'f') {
      e.preventDefault();
      const si = document.getElementById('searchInput');
      if (si) { si.focus(); si.select(); }
      return;
    }

    if (key === 'z' && !e.shiftKey) { if (!isEditable) { e.preventDefault(); history.undo(); } return; }
    if (key === 'y' || (key === 'z' && e.shiftKey)) { if (!isEditable) { e.preventDefault(); history.redo(); } return; }
    if (key === 'x') { if (!isEditable && state.selectedIds.size > 0) { e.preventDefault(); treeLogic.cutSelected(); } return; }
    if (key === 'c') { if (!isEditable && state.selectedIds.size > 0) { e.preventDefault(); treeLogic.copySelected(); } return; }
    if (key === 'v') { if (!isEditable && state.clipboard.nodes.length > 0) { e.preventDefault(); treeLogic.pasteClipboard(); } return; }
    if (key === 'd') { if (!isEditable && state.selectedIds.size > 0) { e.preventDefault(); treeLogic.duplicateSelected(); } return; }

    // Ctrl+E: Expand all / Ctrl+Shift+E: Collapse all
    if (key === 'e' && !isEditable) {
      e.preventDefault();
      if (e.shiftKey) {
        state.collapsedIds = new Set(treeLogic.collectFolderIds(state.tree, []));
      } else {
        state.collapsedIds.clear();
      }
      render.renderTree();
      return;
    }
  });

  const importBox = document.getElementById('importBox');
  const importInput = document.getElementById('importInput');
  document.getElementById('importToggleBtn').onclick = () => {
    importBox.style.display = importBox.style.display === 'none' ? 'block' : 'none';
  };
  document.getElementById('importCancelBtn').onclick = () => { importBox.style.display = 'none'; };
  document.getElementById('importApplyBtn').onclick = () => {
    const text = importInput.value;
    if (!text.trim()) { utils.showStatus(window.TreeApp.i18n.t('import_empty')); return; }
    if (state.tree.length > 0 && !confirm(window.TreeApp.i18n.t('zip_replace_confirm'))) return;
    history.mutate(() => { state.tree.length = 0; zipLogic.parseTextTree(text).forEach(n => state.tree.push(n)); });
    importBox.style.display = 'none';
    importInput.value = '';
  };

  document.getElementById('createRoomBtn').onclick = async () => {
    room.cleanupConnections();
    state.roomId = utils.genRoomId();
    state.role = 'host';
    elements.roomInput.value = state.roomId;
    elements.roomStatus.innerHTML = '<span class="dot"></span> ' + window.TreeApp.i18n.t('room_host_waiting', { roomId: state.roomId });
    utils.updateShareLinkVisibility();
    utils.updateUrlWithRoom();
    state.tree = [];
    state.selectedIds.clear();
    state.undoStack = []; state.redoStack = [];
    await storage.sigWrite('room-' + state.roomId + '-guests', []);
    await storage.save();
    render.renderTree();
    room.startHostListening();
    history.saveState();
  };
  
  // AI Logic
  const aiBox = document.getElementById('aiBox');
  const aiApiKey = document.getElementById('aiApiKey');
  const aiPrompt = document.getElementById('aiPrompt');
  const aiKeySection = document.getElementById('aiKeySection');
  const aiProvider = document.getElementById('aiProvider');
  const aiLabelKey = document.getElementById('aiLabelKey');
  const aiKeyHint = document.getElementById('aiKeyHint');
  
  const aiGoqKeys = document.getElementById('aiGoqKeys');

  if (aiProvider) {
    aiProvider.value = window.TreeApp.ai.getProvider();
    aiApiKey.value = window.TreeApp.ai.getApiKey(aiProvider.value);
    aiGoqKeys.value = window.TreeApp.ai.getApiKey('goq');
    
    const updateProviderUI = (p) => {
      // Toggle single-key vs multi-key input
      const isGoq = p === 'goq';
      aiApiKey.style.display = isGoq ? 'none' : 'block';
      aiGoqKeys.style.display = isGoq ? 'block' : 'none';
      
      if (isGoq) { 
        aiLabelKey.textContent = 'Gemini API Keys (one per line):';
        aiKeyHint.innerHTML = '⚡ GOQ auto-cycles keys when one hits quota. <a href="https://aistudio.google.com/apikey" target="_blank">Get free keys ↗</a>';
      }
      else if (p === 'gemini') { aiLabelKey.textContent = 'Gemini API Key:'; aiApiKey.placeholder = 'AIzaSy...'; aiApiKey.type = 'password'; aiKeyHint.textContent = 'Key is stored safely in your browser.'; }
      else if (p === 'openai') { aiLabelKey.textContent = 'OpenAI API Key:'; aiApiKey.placeholder = 'sk-...'; aiApiKey.type = 'password'; aiKeyHint.textContent = 'Key is stored safely in your browser.'; }
      else if (p === 'openrouter') { aiLabelKey.textContent = 'OpenRouter API Key:'; aiApiKey.placeholder = 'sk-or-v1-...'; aiApiKey.type = 'password'; aiKeyHint.textContent = 'Key is stored safely in your browser.'; }
      else if (p === 'ollama') { aiLabelKey.textContent = 'Ollama Model Name (e.g. llama3):'; aiApiKey.placeholder = 'llama3'; aiApiKey.type = 'text'; aiKeyHint.textContent = 'Ensure Ollama is running on localhost:11434 with OLLAMA_ORIGINS="*".'; }
    };

    aiProvider.onchange = () => {
      const p = aiProvider.value;
      window.TreeApp.ai.setProvider(p);
      // Load the stored value for this provider
      if (p === 'goq') {
        aiGoqKeys.value = window.TreeApp.ai.getApiKey('goq');
      } else {
        aiApiKey.value = window.TreeApp.ai.getApiKey(p);
      }
      updateProviderUI(p);
    };
    updateProviderUI(aiProvider.value);
  }
  
  document.getElementById('aiToggleBtn').onclick = () => { aiBox.style.display = aiBox.style.display === 'none' ? 'block' : 'none'; };
  document.getElementById('aiCancelBtn').onclick = () => { aiBox.style.display = 'none'; };
  
  document.getElementById('aiToggleKeyBtn').onclick = () => {
    aiKeySection.style.display = aiKeySection.style.display === 'none' ? 'block' : 'none';
  };
  
  document.getElementById('deleteSelectedBtn').onclick = () => {
    if (state.selectedIds.size > 0) {
      treeLogic.deleteSelected();
    } else {
      utils.showStatus('Please select items to delete');
    }
  };
  
  document.getElementById('aiGenerateBtn').onclick = async () => {
    const provider = aiProvider.value;
    const key = provider === 'goq' ? aiGoqKeys.value.trim() : aiApiKey.value.trim();
    const prompt = aiPrompt.value.trim();
    
    if (!key && provider !== 'ollama') { 
      utils.showStatus(provider === 'goq' ? 'GOQ: Please add at least one API key' : 'API Key required'); 
      aiKeySection.style.display = 'block';
      if (provider === 'goq') aiGoqKeys.focus(); else aiApiKey.focus();
      return; 
    }
    if (!prompt) { utils.showStatus('Prompt required'); return; }
    
    // Save keys
    if (provider === 'goq') {
      window.TreeApp.ai.setApiKey('goq', key);
    } else {
      window.TreeApp.ai.setApiKey(provider, key);
    }
    
    utils.showStatus('Generating with AI...');
    document.getElementById('aiGenerateBtn').disabled = true;
    
    try {
      const asciiTree = await window.TreeApp.ai.generateTree(prompt, key, provider, (msg) => utils.showStatus(msg));
      const parsedTree = window.TreeApp.zipLogic.parseTextTree(asciiTree);
      if (parsedTree && parsedTree.length > 0) {
        state.tree = parsedTree;
        state.selectedIds.clear();
        state.clipboard = { type: null, nodes: [] };
        render.renderTree();
        history.saveState();
        utils.showStatus('AI generated successfully!');
        aiBox.style.display = 'none';
        aiPrompt.value = '';
      } else {
        utils.showStatus('AI returned empty or invalid tree');
      }
    } catch (err) {
      utils.showStatus('Error: ' + err.message);
    } finally {
      document.getElementById('aiGenerateBtn').disabled = false;
    }
  };

  document.getElementById('shareTemplateBtn').onclick = () => {
    if (!state.tree || state.tree.length === 0) {
      utils.showStatus(window.TreeApp.i18n.t('export_empty') || 'Tree is empty');
      return;
    }
    try {
      const encoded = window.TreeApp.share.encodeTree(state.tree);
      const url = new URL(window.location.href);
      url.searchParams.set('t', encoded);
      navigator.clipboard.writeText(url.toString()).then(() => {
        utils.showStatus(window.TreeApp.i18n.t('toast_copy_link') || 'Template link copied to clipboard!');
      });
    } catch(e) {
      utils.showStatus('Error copying link');
    }
  };

  document.getElementById('joinRoomBtn').onclick = async () => {
    const val = elements.roomInput.value.trim();
    if (!val) { utils.showStatus(window.TreeApp.i18n.t('room_need_id')); return; }
    room.cleanupConnections();
    state.selectedIds.clear();
    state.undoStack = []; state.redoStack = [];
    state.roomId = val;
    utils.updateShareLinkVisibility();
    utils.updateUrlWithRoom();
    await storage.load();
    render.renderTree();
    await room.becomeGuestAndConnect(val);
  };

  elements.shareLinkBtn.onclick = () => utils.copyShareLink();

  document.getElementById('switchLangBtn').onclick = () => {
    const nextLang = window.TreeApp.i18n.currentLang === 'vi' ? 'en' : 'vi';
    window.TreeApp.i18n.setLang(nextLang);
  };

  // Initialize App
  (async function init() {
    window.TreeApp.i18n.translateDOM();
    if (window.TreeApp.utils.updateStatusBar) window.TreeApp.utils.updateStatusBar();
    
    let startRoomId = null;
    let templateHash = null;
    try {
      const params = new URLSearchParams(window.location.search);
      startRoomId = params.get('room');
      templateHash = params.get('t');
    } catch (e) { /* ignore */ }

    if (templateHash) {
      // Priority 1: Load template from URL
      const loadedTree = window.TreeApp.share.decodeTree(templateHash);
      if (loadedTree.length > 0) {
        state.tree = loadedTree;
        state.roomId = null;
        elements.roomInput.value = '';
        utils.updateShareLinkVisibility();
        render.renderTree();
        history.saveState();
        utils.showStatus(window.TreeApp.i18n.t('toast_template_loaded') || 'Template loaded successfully!');
      } else {
        utils.showStatus('Invalid template link');
      }
      
      // Clean up URL
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('t');
        window.history.replaceState({}, document.title, url.toString());
      } catch(e) {}
    } 
    else if (startRoomId) {
      // Priority 2: Join room
      elements.roomInput.value = startRoomId;
      state.roomId = startRoomId;
      utils.updateShareLinkVisibility();
      await storage.load();
      render.renderTree();
      await room.becomeGuestAndConnect(startRoomId);
    } 
    else {
      // Priority 3: Load local storage
      await storage.load();
      render.renderTree();
    }
  })();

})();
