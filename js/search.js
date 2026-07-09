// search.js - Search functionality
window.TreeApp = window.TreeApp || {};

window.TreeApp.search = {
  performSearch(query) {
    const state = window.TreeApp.state;
    const treeLogic = window.TreeApp.treeLogic;
    
    state.matchIds = new Set();
    const q = query.trim().toLowerCase();
    if (!q) { 
      window.TreeApp.render.renderTree(); 
      return; 
    }
    
    (function walk(nodes) {
      nodes.forEach(n => {
        if (n.name.toLowerCase().includes(q)) state.matchIds.add(n.id);
        if (n.children) walk(n.children);
      });
    })(state.tree);
    
    state.matchIds.forEach(id => treeLogic.expandAncestorsOf(id));
    window.TreeApp.render.renderTree();
    
    if (state.matchIds.size === 0) { 
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('search_not_found')); 
      return; 
    }
    
    const firstId = [...state.matchIds][0];
    requestAnimationFrame(() => {
      const treeEl = window.TreeApp.elements.treeEl;
      const el = treeEl.querySelector('[data-id="' + firstId + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
};
