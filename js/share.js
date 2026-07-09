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

  minifyKeys(nodes) {
    return nodes.map(n => {
      const copy = {};
      if (n.name) copy.n = n.name;
      if (n.type) copy.t = n.type;
      if (n.note) copy.d = n.note;
      if (n.children) copy.c = this.minifyKeys(n.children);
      return copy;
    });
  },

  expandKeys(nodes) {
    return nodes.map(n => {
      const copy = { id: window.TreeApp.utils.uid() };
      if (n.name !== undefined) copy.name = n.name; else if (n.n !== undefined) copy.name = n.n;
      if (n.type !== undefined) copy.type = n.type; else if (n.t !== undefined) copy.type = n.t;
      if (n.note !== undefined) copy.note = n.note; else if (n.d !== undefined) copy.note = n.d;
      
      if (n.children) {
        copy.children = this.expandKeys(n.children);
      } else if (n.c) {
        copy.children = this.expandKeys(n.c);
      }
      return copy;
    });
  },

  encodeTree(tree) {
    if (!tree || tree.length === 0) return '';
    const minified = this.minifyKeys(tree);
    const json = JSON.stringify(minified);
    if (window.LZString) {
      return LZString.compressToEncodedURIComponent(json);
    }
    return btoa(encodeURIComponent(json));
  },

  decodeTree(hash) {
    if (!hash) return [];
    try {
      let json = '';
      if (window.LZString) {
        json = LZString.decompressFromEncodedURIComponent(hash);
      }
      if (!json) {
        json = decodeURIComponent(atob(hash));
      }
      const parsed = JSON.parse(json);
      return this.expandKeys(parsed);
    } catch (e) {
      console.error('Failed to decode tree from hash', e);
      return [];
    }
  }
};
