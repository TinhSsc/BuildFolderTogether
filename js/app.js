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
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) { if (!isEditable) { e.preventDefault(); history.undo(); } return; }
    if (key === 'y' || (key === 'z' && e.shiftKey)) { if (!isEditable) { e.preventDefault(); history.redo(); } return; }
    if (key === 'x') { if (!isEditable && state.selectedIds.size > 0) { e.preventDefault(); treeLogic.cutSelected(); } return; }
    if (key === 'c') { if (!isEditable && state.selectedIds.size > 0) { e.preventDefault(); treeLogic.copySelected(); } return; }
    if (key === 'v') { if (!isEditable && state.clipboard.nodes.length > 0) { e.preventDefault(); treeLogic.pasteClipboard(); } return; }
    if (key === 'd') { if (!isEditable && state.selectedIds.size > 0) { e.preventDefault(); treeLogic.duplicateSelected(); } return; }
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
    try {
      const params = new URLSearchParams(window.location.search);
      startRoomId = params.get('room');
    } catch (e) { /* ignore */ }

    if (startRoomId) {
      elements.roomInput.value = startRoomId;
      state.roomId = startRoomId;
      utils.updateShareLinkVisibility();
      await storage.load();
      render.renderTree();
      await room.becomeGuestAndConnect(startRoomId);
    } else {
      await storage.load();
      render.renderTree();
    }
  })();

})();
