// share.js - Template link sharing
window.TreeApp = window.TreeApp || {};

window.TreeApp.share = {
  stripIds(nodes) {
    return nodes.map(n => {
      const copy = { ...n };
      delete copy.id;
      if (copy.children) copy.children = this.stripIds(copy.children);
      return copy;
    });
  },

  assignIds(nodes) {
    return nodes.map(n => {
      const copy = { ...n };
      copy.id = window.TreeApp.utils.uid();
      if (copy.children) copy.children = this.assignIds(copy.children);
      return copy;
    });
  },

  encodeTree(tree) {
    if (!tree || tree.length === 0) return '';
    const cleanTree = this.stripIds(tree);
    const json = JSON.stringify(cleanTree);
    return btoa(encodeURIComponent(json));
  },

  decodeTree(hash) {
    if (!hash) return [];
    try {
      const json = decodeURIComponent(atob(hash));
      const parsed = JSON.parse(json);
      return this.assignIds(parsed);
    } catch (e) {
      console.error('Failed to decode tree from hash', e);
      return [];
    }
  }
};
