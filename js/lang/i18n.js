// lang/i18n.js - Localization setup
window.TreeApp = window.TreeApp || {};
window.TreeApp.lang = window.TreeApp.lang || {};

window.TreeApp.i18n = {
  currentLang: (() => {
    try { return localStorage.getItem('TreeApp_Lang') || 'vi'; }
    catch(e) { return 'vi'; }
  })(),
  
  t(key, params = {}) {
    const dict = window.TreeApp.lang[this.currentLang] || window.TreeApp.lang['vi'];
    let str = dict[key] || key;
    for (const p in params) {
      str = str.replace(`{${p}}`, params[p]);
    }
    return str;
  },

  setLang(langCode) {
    if (window.TreeApp.lang[langCode]) {
      this.currentLang = langCode;
      try { localStorage.setItem('TreeApp_Lang', langCode); } catch(e) {}
      this.translateDOM();
      // Re-render tree to apply translation there
      if (window.TreeApp.render && window.TreeApp.render.renderTree) {
        window.TreeApp.render.renderTree();
      }
    }
  },

  translateDOM() {
    const el = (id) => document.getElementById(id);
    if(el('titleText')) el('titleText').textContent = this.t('app_title');
    if(el('hintText')) el('hintText').textContent = this.t('app_hint');
    if(el('searchInput')) el('searchInput').placeholder = this.t('search_placeholder');
    if(el('searchClearBtn')) el('searchClearBtn').textContent = this.t('search_clear');
    if(el('addRootFolder')) el('addRootFolder').textContent = this.t('btn_add_root_folder');
    if(el('addRootFile')) el('addRootFile').textContent = this.t('btn_add_root_file');
    if(el('cutBtn')) el('cutBtn').innerHTML = this.t('btn_cut');
    if(el('copyBtn')) el('copyBtn').innerHTML = this.t('btn_copy');
    if(el('pasteBtn')) el('pasteBtn').innerHTML = this.t('btn_paste');
    if(el('duplicateBtn')) el('duplicateBtn').innerHTML = this.t('btn_duplicate');
    if(el('undoBtn')) el('undoBtn').innerHTML = this.t('btn_undo');
    if(el('redoBtn')) el('redoBtn').innerHTML = this.t('btn_redo');
    if(el('collapseAllBtn')) el('collapseAllBtn').textContent = this.t('btn_collapse_all');
    if(el('expandAllBtn')) el('expandAllBtn').textContent = this.t('btn_expand_all');
    if(el('importToggleBtn')) el('importToggleBtn').textContent = this.t('btn_import_toggle');
    if(el('uploadZipBtn')) el('uploadZipBtn').textContent = this.t('btn_upload_zip');
    if(el('exportBtn')) el('exportBtn').textContent = this.t('btn_export');
    if(el('zipBtn')) el('zipBtn').textContent = this.t('btn_zip');
    if(el('importInput')) el('importInput').placeholder = this.t('import_placeholder');
    if(el('importApplyBtn')) el('importApplyBtn').textContent = this.t('btn_import_apply');
    if(el('importCancelBtn')) el('importCancelBtn').textContent = this.t('btn_import_cancel');
    if(el('roomInput')) el('roomInput').placeholder = this.t('room_input_placeholder');
    if(el('joinRoomBtn')) el('joinRoomBtn').textContent = this.t('btn_join_room');
    if(el('createRoomBtn')) el('createRoomBtn').textContent = this.t('btn_create_room');
    if(el('shareLinkBtn')) el('shareLinkBtn').innerHTML = this.t('btn_share_link');
    if(el('switchLangBtn')) el('switchLangBtn').textContent = this.t('switch_lang');

    if(el('footerAbout')) el('footerAbout').innerHTML = this.t('footer_about');

    if (!window.TreeApp.state.roomId) {
      if(el('roomStatus')) el('roomStatus').textContent = this.t('room_status_offline');
    }
  }
};
