// storage.js - Storage helpers
window.TreeApp = window.TreeApp || {};

window.TreeApp.storage = {
  storageKey() { 
    return window.TreeApp.state.roomId ? ('room-' + window.TreeApp.state.roomId) : 'file-tree'; 
  },
  
  isShared() { 
    return !!window.TreeApp.state.roomId; 
  },

  async save() {
    try {
      window.TreeApp.state.lastSaved = new Date();
      if (window.TreeApp.utils.updateStatusBar) window.TreeApp.utils.updateStatusBar();
      const json = JSON.stringify(window.TreeApp.state.tree);
      // Assuming window.storage is provided globally (e.g., via some external Android/WebView injection)
      // If it doesn't exist, we could fallback to localStorage, but we stick to original behavior.
      if (window.storage) {
        await window.storage.set(this.storageKey(), json, this.isShared());
      } else {
        localStorage.setItem(this.storageKey(), json); // fallback
      }
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('save_done'));
    } catch (e) {
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('save_err'));
      console.error(e);
    }
  },

  async load() {
    try {
      let res;
      if (window.storage) {
        res = await window.storage.get(this.storageKey(), this.isShared());
      } else {
        const val = localStorage.getItem(this.storageKey());
        res = val ? { value: val } : null;
      }

      if (res && res.value) {
        window.TreeApp.state.tree = JSON.parse(res.value);
      } else {
        window.TreeApp.state.tree = [];
      }
    } catch (e) {
      window.TreeApp.state.tree = [];
    }
  },

  // Signaling helpers (storage used only for WebRTC handshake)
  async sigWrite(key, value) {
    try { 
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(value), true); 
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) { console.error(e); }
  },

  async sigRead(key) {
    try {
      let r;
      if (window.storage) {
        r = await window.storage.get(key, true);
      } else {
        const val = localStorage.getItem(key);
        r = val ? { value: val } : null;
      }
      return r && r.value ? JSON.parse(r.value) : null;
    } catch (e) { return null; }
  },

  async sigPushToList(key, item) {
    const cur = (await this.sigRead(key)) || [];
    cur.push(item);
    await this.sigWrite(key, cur);
  },

  async pushIce(key, candidate) {
    const cur = (await this.sigRead(key)) || [];
    cur.push(candidate);
    await this.sigWrite(key, cur);
  }
};
