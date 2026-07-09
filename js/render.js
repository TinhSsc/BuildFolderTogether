// render.js - UI rendering logic
window.TreeApp = window.TreeApp || {};

window.TreeApp.render = {
  getFileIcon(name) {
    name = name.toLowerCase();
    if (name.endsWith('.js') || name.endsWith('.jsx')) return '<i class="bx bxl-javascript" style="color: #f7df1e;"></i>';
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return '<i class="bx bxl-typescript" style="color: #3178c6;"></i>';
    if (name.endsWith('.html')) return '<i class="bx bxl-html5" style="color: #e34f26;"></i>';
    if (name.endsWith('.css')) return '<i class="bx bxl-css3" style="color: #1572b6;"></i>';
    if (name.endsWith('.json')) return '<i class="bx bxs-file-json" style="color: #8b5cf6;"></i>';
    if (name.endsWith('.md')) return '<i class="bx bxl-markdown" style="color: #000000;"></i>';
    if (name.endsWith('.py')) return '<i class="bx bxl-python" style="color: #3776ab;"></i>';
    if (name.endsWith('.java')) return '<i class="bx bxl-java" style="color: #b07219;"></i>';
    if (name.endsWith('.php')) return '<i class="bx bxl-php" style="color: #777bb4;"></i>';
    if (name.endsWith('.go')) return '<i class="bx bxl-go" style="color: #00add8;"></i>';
    if (name.endsWith('.svg') || name.endsWith('.png') || name.endsWith('.jpg')) return '<i class="bx bx-image" style="color: #10b981;"></i>';
    if (name === 'dockerfile' || name === 'docker-compose.yml') return '<i class="bx bxl-docker" style="color: #2496ed;"></i>';
    if (name === '.gitignore') return '<i class="bx bxl-git" style="color: #f14e32;"></i>';
    return '<i class="bx bx-file-blank" style="color: #94a3b8;"></i>';
  },

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

    const caret = document.createElement('span');
    caret.className = 'caret' + (node.type === 'folder' ? '' : ' spacer');
    if (node.type === 'folder') {
      if (!state.collapsedIds.has(node.id)) caret.classList.add('expanded');
      caret.innerHTML = "<i class='bx bx-chevron-right'></i>";
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
    icon.className = 'icon' + (node.type === 'folder' ? ' folder' : '');
    icon.innerHTML = node.type === 'folder' 
      ? (state.collapsedIds.has(node.id) ? "<i class='bx bxs-folder'></i>" : "<i class='bx bxs-folder-open'></i>") 
      : (node.type === 'gitkeep' ? "<i class='bx bx-pin' style='color:#ef4444'></i>" : this.getFileIcon(node.name));
    row.appendChild(icon);

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
    row.appendChild(input);

    const actions = document.createElement('span');
    actions.className = 'actions';

    if (node.type === 'folder') {
      const addF = document.createElement('button');
      addF.innerHTML = "<i class='bx bx-folder-plus'></i>";
      addF.title = window.TreeApp.i18n.t('title_add_folder');
      addF.onclick = () => { window.TreeApp.history.mutate(() => treeLogic.addNode(node.children, 'folder')); };
      actions.appendChild(addF);

      const addFile = document.createElement('button');
      addFile.innerHTML = "<i class='bx bx-file-plus'></i>";
      addFile.title = window.TreeApp.i18n.t('title_add_file');
      addFile.onclick = () => { window.TreeApp.history.mutate(() => treeLogic.addNode(node.children, 'file')); };
      actions.appendChild(addFile);

      const addGitkeep = document.createElement('button');
      addGitkeep.innerHTML = "<i class='bx bx-pin'></i>";
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
      noteBtn.innerHTML = "<i class='bx bx-edit'></i>";
      noteBtn.title = window.TreeApp.i18n.t('title_note_gitkeep');
      noteBtn.onclick = () => { node._noteOpen = !node._noteOpen; this.renderTree(); };
      actions.appendChild(noteBtn);
    }

    const del = document.createElement('button');
    del.innerHTML = "<i class='bx bx-trash'></i>";
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
      node.children.forEach(child => childrenEl.appendChild(this.renderNode(child)));
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
      }
    };
  }
};
