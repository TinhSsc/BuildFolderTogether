// config.js - Global App Namespace and Config
window.TreeApp = window.TreeApp || {};

window.TreeApp.state = {
  tree: [],
  roomId: null,
  selectedIds: new Set(),
  clipboard: { nodes: [] },
  undoStack: [],
  redoStack: [],
  collapsedIds: new Set(),
  matchIds: new Set(),
  activeContextMenu: null,
  compactGitkeep: false,

  // P2P (WebRTC) state
  role: null, // 'host' | 'guest' | null
  myGuestId: null,
  hostConnections: new Map(), // guestId -> { pc, dc, timers: [] }
  guestConn: null, // { pc, dc, timers: [] }
  guestListPollTimer: null,
  RTC_CONFIG: { iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]}
};

window.TreeApp.elements = {
  get treeEl() { return document.getElementById('tree'); },
  get statusEl() { return document.getElementById('status'); },
  get exportBox() { return document.getElementById('exportBox'); },
  get exportOutput() { return document.getElementById('exportOutput'); },
  get roomStatus() { return document.getElementById('roomStatus'); },
  get roomInput() { return document.getElementById('roomInput'); },
  get shareLinkBtn() { return document.getElementById('shareLinkBtn'); }
};
