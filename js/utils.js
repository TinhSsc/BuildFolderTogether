// utils.js - Helper functions
window.TreeApp = window.TreeApp || {};

window.TreeApp.utils = {
  uid() { 
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); 
  },
  
  genRoomId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  showStatus(msg) {
    const statusEl = window.TreeApp.elements.statusEl;
    statusEl.textContent = msg;
    setTimeout(() => { 
      if (statusEl.textContent === msg) statusEl.textContent = ''; 
    }, 1500);
  },

  updateShareLinkVisibility() {
    window.TreeApp.elements.shareLinkBtn.style.display = window.TreeApp.state.roomId ? 'inline-block' : 'none';
  },

  updateUrlWithRoom() {
    try {
      const url = new URL(window.location.href);
      if (window.TreeApp.state.roomId) {
        url.searchParams.set('room', window.TreeApp.state.roomId); 
      } else {
        url.searchParams.delete('room');
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) { /* ignore if not permitted in this environment */ }
  },

  async shortenUrl(longUrl) {
    if (longUrl.length < 200) return longUrl;
    try {
      const response = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(longUrl));
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.warn('Failed to shorten URL, using long URL', e);
    }
    return longUrl;
  },

  async copyShareLink() {
    if (!window.TreeApp.state.roomId) return;
    let link;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', window.TreeApp.state.roomId);
      link = url.toString();
    } catch (e) {
      link = window.TreeApp.state.roomId;
    }
    try {
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('creating_link') || 'Đang tạo link rút gọn...');
      const finalLink = await this.shortenUrl(link);
      await navigator.clipboard.writeText(finalLink);
      if (finalLink !== link) {
        window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('link_copied_short') || 'Đã chép link rút gọn!');
      } else {
        window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('link_copied') || 'Đã chép link!');
      }
    } catch (e) {
      const roomInput = window.TreeApp.elements.roomInput;
      roomInput.value = link;
      roomInput.select();
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('link_copy_failed') || 'Lỗi khi chép link');
    }
  },

  updateStatusBar() {
    const state = window.TreeApp.state;
    const el = (id) => document.getElementById(id);
    if (!el('statNodes')) return;

    let total = 0;
    const countNodes = (arr) => {
      arr.forEach(n => {
        total++;
        if(n.children) countNodes(n.children);
      });
    };
    countNodes(state.tree);

    el('statNodes').textContent = `${total} Nodes`;
    
    const mode = state.roomId ? `P2P Room` : 'Local';
    if(el('statMode')) el('statMode').textContent = mode;
    
    if(el('statSaved')) {
      if (state.lastSaved) {
        const d = state.lastSaved;
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        el('statSaved').textContent = `Saved ${hh}:${mm}`;
      } else {
        el('statSaved').textContent = `Unsaved`;
      }
    }
  },

  cloneWithNewIds(node) {
    const clone = JSON.parse(JSON.stringify(node));
    (function assign(n) { 
      n.id = window.TreeApp.utils.uid(); 
      if (n.children) n.children.forEach(assign); 
    })(clone);
    return clone;
  }
};
