// render.js - UI rendering logic
window.TreeApp = window.TreeApp || {};

window.TreeApp.render = {
  renderNode(node) {
    const state = window.TreeApp.state;
    const treeLogic = window.TreeApp.treeLogic;
    const wrap = document.createElement('div');
    wrap.className = 'node';

    const row = document.createElement('div');
    row.className = 'node-row' + (state.selectedIds.has(node.id) ? ' selected' : '') + (state.matchIds.has(node.id) ? ' match' : '');
    row.draggable = true;
    row.dataset.id = node.id;

    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.TreeApp.contextMenu.showContextMenu(e.clientX, e.clientY, node);
    });

    row.addEventListener('click', (e) => {
      const t = e.target;
      if (t.tagName === 'INPUT' || t.tagName === 'BUTTON' || t.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) {
        if (state.selectedIds.has(node.id)) state.selectedIds.delete(node.id); else state.selectedIds.add(node.id);
      } else {
        state.selectedIds = new Set([node.id]);
      }
      this.renderTree();
      
      const purposePopup = document.getElementById('purposePopup');
      if (purposePopup) {
        if (node.type === 'folder' && state.selectedIds.has(node.id)) {
          const gitkeep = node.children ? node.children.find(c => c.type === 'gitkeep') : null;
          if (gitkeep && gitkeep.note) {
             document.getElementById('purposeFolderName').textContent = node.name;
             document.getElementById('purposeContent').textContent = gitkeep.note;
             purposePopup.style.display = 'block';
          } else {
             purposePopup.style.display = 'none';
          }
        } else if (!e.ctrlKey && !e.metaKey) {
          purposePopup.style.display = 'none';
        }
      }
    });

    row.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    
    if (node.type === 'folder') {
      row.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', () => { row.classList.remove('drag-over'); });
      row.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        row.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        window.TreeApp.history.mutate(() => treeLogic.moveNode(draggedId, node.id));
      });
    }

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '&#8942;&#8942;'; // double vertical ellipsis ⋮⋮
    row.appendChild(dragHandle);

    const caret = document.createElement('span');
    caret.className = 'caret' + (node.type === 'folder' ? '' : ' spacer');
    if (node.type === 'folder') {
      caret.textContent = state.collapsedIds.has(node.id) ? '▶' : '▼';
      caret.onclick = (e) => {
        e.stopPropagation();
        if (state.collapsedIds.has(node.id)) state.collapsedIds.delete(node.id); else state.collapsedIds.add(node.id);
        this.renderTree();
      };
    } else {
      caret.textContent = '';
    }
    row.appendChild(caret);

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = node.type === 'folder' ? '📁' : (node.type === 'gitkeep' ? '📌' : '📄');
    row.appendChild(icon);

    const inputContainer = document.createElement('div');
    inputContainer.className = 'name-input-container';

    const input = document.createElement('input');
    input.className = 'name-input';
    input.value = node.name;
    input.onfocus = () => { input._snapshot = JSON.stringify(state.tree); };
    input.oninput = () => { node.name = input.value; };
    input.onblur = () => {
      const siblings = state.tree.some(n => n.id === node.id) ? state.tree : (treeLogic.findParentArray(state.tree, node.id) || []);
      const others = siblings.filter(s => s.id !== node.id);
      if (others.some(s => s.name === node.name)) {
        node.name = treeLogic.uniqueName(others, node.name);
        input.value = node.name;
        window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('err_duplicate_name') + node.name);
      }
      if (input._snapshot && input._snapshot !== JSON.stringify(state.tree)) {
        state.undoStack.push(input._snapshot);
        if (state.undoStack.length > 50) state.undoStack.shift();
        state.redoStack = [];
      }
      window.TreeApp.storage.save();
      window.TreeApp.room.broadcastTreeChange();
    };
    inputContainer.appendChild(input);

    row.appendChild(inputContainer);

    const actions = document.createElement('span');
    actions.className = 'actions';

    if (node.type === 'folder') {
      const addF = document.createElement('button');
      addF.textContent = '+📁';
      addF.title = window.TreeApp.i18n.t('title_add_folder');
      addF.onclick = () => { window.TreeApp.history.mutate(() => treeLogic.addNode(node.children, 'folder')); };
      actions.appendChild(addF);

      const addFile = document.createElement('button');
      addFile.textContent = '+📄';
      addFile.title = window.TreeApp.i18n.t('title_add_file');
      addFile.onclick = () => { window.TreeApp.history.mutate(() => treeLogic.addNode(node.children, 'file')); };
      actions.appendChild(addFile);

      const addGitkeep = document.createElement('button');
      addGitkeep.textContent = '+.gitkeep';
      addGitkeep.title = window.TreeApp.i18n.t('title_add_gitkeep');
      addGitkeep.onclick = () => {
        window.TreeApp.history.mutate(() => { 
          node.children.push({ id: window.TreeApp.utils.uid(), name: treeLogic.uniqueName(node.children, '.gitkeep'), type: 'gitkeep', note: '' }); 
        });
      };
      actions.appendChild(addGitkeep);
    }

    if (node.type === 'gitkeep') {
      const noteBtn = document.createElement('button');
      noteBtn.textContent = '📝';
      noteBtn.title = window.TreeApp.i18n.t('title_note_gitkeep');
      noteBtn.onclick = () => { node._noteOpen = !node._noteOpen; this.renderTree(); };
      actions.appendChild(noteBtn);
    }

    // Toggle file <-> folder (only for files and empty folders)
    const canToggle = node.type === 'file' || (node.type === 'folder' && (!node.children || node.children.length === 0));
    if (canToggle) {
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = node.type === 'folder' ? '📄' : '📁';
      toggleBtn.title = node.type === 'folder' ? 'Convert to File' : 'Convert to Folder';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        window.TreeApp.history.mutate(() => {
          if (node.type === 'file') {
            node.type = 'folder';
            node.children = [];
          } else {
            node.type = 'file';
            delete node.children;
          }
        });
      };
      actions.appendChild(toggleBtn);
    }

    const del = document.createElement('button');
    del.textContent = '✕';
    del.title = window.TreeApp.i18n.t('title_delete');
    del.onclick = () => { window.TreeApp.history.mutate(() => treeLogic.deleteNode(node.id)); };
    actions.appendChild(del);

    row.appendChild(actions);
    wrap.appendChild(row);

    if (node.type === 'gitkeep' && node._noteOpen) {
      const noteWrap = document.createElement('div');
      noteWrap.className = 'note-toggle';
      const noteTa = document.createElement('textarea');
      noteTa.placeholder = window.TreeApp.i18n.t('placeholder_note');
      noteTa.value = node.note || '';
      noteTa.oninput = () => { node.note = noteTa.value; };
      noteTa.onblur = () => { window.TreeApp.storage.save(); window.TreeApp.room.broadcastTreeChange(); };
      noteWrap.appendChild(noteTa);
      wrap.appendChild(noteWrap);
    }

    if (node.type === 'folder' && !state.collapsedIds.has(node.id)) {
      const childrenEl = document.createElement('div');
      childrenEl.className = 'children';
      let childrenToRender = node.children;
      if (state.compactGitkeep) {
        childrenToRender = node.children.filter(c => c.type !== 'gitkeep');
      }
      childrenToRender.forEach(child => childrenEl.appendChild(this.renderNode(child)));
      wrap.appendChild(childrenEl);
    }

    return wrap;
  },

  renderTree() {
    const state = window.TreeApp.state;
    const treeEl = window.TreeApp.elements.treeEl;
    treeEl.innerHTML = '';
    
    if (state.tree.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = window.TreeApp.i18n.t('empty_tree');
      treeEl.appendChild(empty);
    } else {
      state.tree.forEach(node => treeEl.appendChild(this.renderNode(node)));
    }
    
    if (window.TreeApp.utils.updateStatusBar) {
      window.TreeApp.utils.updateStatusBar();
    }
    
    treeEl.ondragover = (e) => { e.preventDefault(); };
    treeEl.ondrop = (e) => {
      if (e.target !== treeEl) return;
      const draggedId = e.dataTransfer.getData('text/plain');
      window.TreeApp.history.mutate(() => window.TreeApp.treeLogic.moveNode(draggedId, null));
    };
    
    treeEl.onclick = (e) => {
      if (e.target === treeEl && state.selectedIds.size > 0) { 
        state.selectedIds.clear(); 
        this.renderTree(); 
        const purposePopup = document.getElementById('purposePopup');
        if (purposePopup) purposePopup.style.display = 'none';
      }
    };
  }
};
