// tree.js - Core tree manipulation logic
window.TreeApp = window.TreeApp || {};

window.TreeApp.treeLogic = {
  findParentArray(nodes, id) {
    for (const n of nodes) {
      if (n.children) {
        const idx = n.children.findIndex(c => c.id === id);
        if (idx !== -1) return n.children;
        const found = this.findParentArray(n.children, id);
        if (found) return found;
      }
    }
    return null;
  },

  findNodeById(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = this.findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return null;
  },

  isDescendant(node, targetId) {
    if (!node.children) return false;
    for (const c of node.children) {
      if (c.id === targetId) return true;
      if (this.isDescendant(c, targetId)) return true;
    }
    return false;
  },

  uniqueName(siblings, name) {
    const existingNames = new Set(siblings.map(n => n.name));
    if (!existingNames.has(name)) return name;
    const dotIndex = name.lastIndexOf('.');
    let base = name, ext = '';
    if (dotIndex > 0) { base = name.slice(0, dotIndex); ext = name.slice(dotIndex); }
    let i = 1, candidate;
    do {
      candidate = base + ' (' + i + ')' + ext;
      i++;
    } while (existingNames.has(candidate));
    return candidate;
  },

  addNode(parentChildren, type) {
    const baseName = type === 'folder' ? 'new-folder' : 'new-file.ts';
    const node = { id: window.TreeApp.utils.uid(), name: this.uniqueName(parentChildren, baseName), type };
    if (type === 'folder') node.children = [];
    parentChildren.push(node);
    return node;
  },

  deleteNode(id) {
    const tree = window.TreeApp.state.tree;
    const idx = tree.findIndex(n => n.id === id);
    if (idx !== -1) { tree.splice(idx, 1); return; }
    const parentArr = this.findParentArray(tree, id);
    if (parentArr) {
      const i = parentArr.findIndex(n => n.id === id);
      if (i !== -1) parentArr.splice(i, 1);
    }
  },

  moveNode(draggedId, targetFolderId) {
    if (draggedId === targetFolderId) return;
    const tree = window.TreeApp.state.tree;
    const draggedNode = this.findNodeById(tree, draggedId);
    if (!draggedNode) return;
    if (draggedNode.type === 'folder' && this.isDescendant(draggedNode, targetFolderId)) return;
    const targetNode = targetFolderId === null ? null : this.findNodeById(tree, targetFolderId);
    if (targetFolderId !== null && (!targetNode || targetNode.type !== 'folder')) return;

    const rootIdx = tree.findIndex(n => n.id === draggedId);
    if (rootIdx !== -1) tree.splice(rootIdx, 1);
    else {
      const parentArr = this.findParentArray(tree, draggedId);
      if (parentArr) {
        const i = parentArr.findIndex(n => n.id === draggedId);
        if (i !== -1) parentArr.splice(i, 1);
      }
    }

    if (targetFolderId === null) tree.push(draggedNode);
    else targetNode.children.push(draggedNode);
  },

  getParentFolderId(id) {
    const tree = window.TreeApp.state.tree;
    if (tree.some(n => n.id === id)) return null;
    function search(nodes, parentId) {
      for (const n of nodes) {
        if (n.id === id) return parentId;
        if (n.children) {
          const res = search(n.children, n.id);
          if (res !== undefined) return res;
        }
      }
      return undefined;
    }
    const found = search(tree, null);
    return found === undefined ? null : found;
  },

  collectFolderIds(nodes, acc) {
    nodes.forEach(n => { if (n.type === 'folder') { acc.push(n.id); this.collectFolderIds(n.children, acc); } });
    return acc;
  },

  expandAncestorsOf(id) {
    const state = window.TreeApp.state;
    function search(nodes, ancestors) {
      for (const n of nodes) {
        if (n.id === id) { ancestors.forEach(a => state.collapsedIds.delete(a)); return true; }
        if (n.children && search(n.children, [...ancestors, n.id])) return true;
      }
      return false;
    }
    search(state.tree, []);
  },

  cutSelected() {
    const state = window.TreeApp.state;
    if (state.selectedIds.size === 0) { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('sel_empty')); return; }
    window.TreeApp.history.mutate(() => {
      const nodes = [...state.selectedIds].map(id => this.findNodeById(state.tree, id)).filter(Boolean);
      state.clipboard = { nodes: nodes.map(n => JSON.parse(JSON.stringify(n))) };
      [...state.selectedIds].forEach(id => this.deleteNode(id));
      state.selectedIds.clear();
    });
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('cut_done'));
  },

  pasteClipboard(explicitTargetId) {
    const state = window.TreeApp.state;
    if (state.clipboard.nodes.length === 0) { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('clipboard_empty')); return; }
    window.TreeApp.history.mutate(() => {
      const resolvedTargetId = explicitTargetId !== undefined ? explicitTargetId : (state.selectedIds.size === 1 ? [...state.selectedIds][0] : null);
      let targetChildren = state.tree;
      if (resolvedTargetId) {
        const targetNode = this.findNodeById(state.tree, resolvedTargetId);
        if (targetNode && targetNode.type === 'folder') targetChildren = targetNode.children;
      }
      state.clipboard.nodes.forEach(n => {
        const cloned = window.TreeApp.utils.cloneWithNewIds(n);
        cloned.name = this.uniqueName(targetChildren, cloned.name);
        targetChildren.push(cloned);
      });
    });
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('paste_done'));
  },

  deleteSelected() {
    const state = window.TreeApp.state;
    if (state.selectedIds.size === 0) { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('sel_empty')); return; }
    window.TreeApp.history.mutate(() => { 
      [...state.selectedIds].forEach(id => this.deleteNode(id)); 
      state.selectedIds.clear(); 
    });
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('delete_done'));
  },

  copySelected() {
    const state = window.TreeApp.state;
    if (state.selectedIds.size === 0) { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('sel_empty')); return; }
    const nodes = [...state.selectedIds].map(id => this.findNodeById(state.tree, id)).filter(Boolean);
    state.clipboard = { nodes: nodes.map(n => JSON.parse(JSON.stringify(n))) };
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('copy_done'));
  },

  duplicateSelected() {
    const state = window.TreeApp.state;
    if (state.selectedIds.size === 0) { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('sel_empty')); return; }
    window.TreeApp.history.mutate(() => {
      [...state.selectedIds].forEach(id => {
        const node = this.findNodeById(state.tree, id);
        if (!node) return;
        const parentArr = state.tree.some(n => n.id === id) ? state.tree : this.findParentArray(state.tree, id);
        if (!parentArr) return;
        const idx = parentArr.findIndex(n => n.id === id);
        const dup = window.TreeApp.utils.cloneWithNewIds(node);
        dup.name = this.uniqueName(parentArr, dup.name);
        parentArr.splice(idx + 1, 0, dup);
      });
    });
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('duplicate_done'));
  }
};
