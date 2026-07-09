// contextMenu.js - Custom context menu
window.TreeApp = window.TreeApp || {};

window.TreeApp.contextMenu = {
  hideContextMenu() {
    const state = window.TreeApp.state;
    if (state.activeContextMenu) { 
      state.activeContextMenu.remove(); 
      state.activeContextMenu = null; 
    }
  },

  showContextMenu(x, y, node) {
    this.hideContextMenu();
    const state = window.TreeApp.state;
    const treeLogic = window.TreeApp.treeLogic;
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    const item = (label, onClick, disabled) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.disabled = !!disabled;
      b.onclick = (e) => { e.stopPropagation(); this.hideContextMenu(); onClick(); };
      menu.appendChild(b);
    };

    item(window.TreeApp.i18n.t('ctx_rename'), () => {
      state.selectedIds = new Set([node.id]);
      window.TreeApp.render.renderTree();
      const treeEl = window.TreeApp.elements.treeEl;
      const inp = treeEl.querySelector('[data-id="' + node.id + '"] .name-input');
      if (inp) { inp.focus(); inp.select(); }
    });
    
    item(window.TreeApp.i18n.t('ctx_delete'), () => { state.selectedIds = new Set([node.id]); treeLogic.deleteSelected(); });
    item(window.TreeApp.i18n.t('ctx_copy'), () => { state.selectedIds = new Set([node.id]); treeLogic.copySelected(); });
    item(window.TreeApp.i18n.t('ctx_cut'), () => { state.selectedIds = new Set([node.id]); treeLogic.cutSelected(); });
    item(window.TreeApp.i18n.t('ctx_duplicate'), () => { state.selectedIds = new Set([node.id]); treeLogic.duplicateSelected(); });
    
    item(window.TreeApp.i18n.t('ctx_paste'), () => {
      const targetId = node.type === 'folder' ? node.id : treeLogic.getParentFolderId(node.id);
      treeLogic.pasteClipboard(targetId);
    }, state.clipboard.nodes.length === 0);
    
    if (node.type === 'folder') {
      item(window.TreeApp.i18n.t('ctx_new_folder'), () => window.TreeApp.history.mutate(() => treeLogic.addNode(node.children, 'folder')));
      item(window.TreeApp.i18n.t('ctx_new_file'), () => window.TreeApp.history.mutate(() => treeLogic.addNode(node.children, 'file')));
    }

    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    menu.style.left = Math.min(x, maxX) + 'px';
    menu.style.top = Math.min(y, maxY) + 'px';
    state.activeContextMenu = menu;
  }
};
