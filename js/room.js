// room.js - P2P connection logic using WebRTC
window.TreeApp = window.TreeApp || {};

window.TreeApp.room = {
  cleanupConnections() {
    const state = window.TreeApp.state;
    if (state.guestListPollTimer) { clearInterval(state.guestListPollTimer); state.guestListPollTimer = null; }
    state.hostConnections.forEach(conn => {
      conn.timers.forEach(t => clearInterval(t));
      try { conn.pc && conn.pc.close(); } catch (e) {}
    });
    state.hostConnections.clear();
    if (state.guestConn) {
      state.guestConn.timers.forEach(t => clearInterval(t));
      try { state.guestConn.pc && state.guestConn.pc.close(); } catch (e) {}
      state.guestConn = null;
    }
    state.role = null;
    state.myGuestId = null;
  },

  startHostListening() {
    const state = window.TreeApp.state;
    state.guestListPollTimer = setInterval(async () => {
      const guests = (await window.TreeApp.storage.sigRead('room-' + state.roomId + '-guests')) || [];
      for (const gid of guests) {
        if (!state.hostConnections.has(gid)) {
          state.hostConnections.set(gid, { pc: null, dc: null, timers: [] });
          this.connectToGuest(gid);
        }
      }
      this.updateRoomStatusHost();
    }, 2000);
  },

  async connectToGuest(guestId) {
    const state = window.TreeApp.state;
    const pc = new RTCPeerConnection(state.RTC_CONFIG);
    const conn = state.hostConnections.get(guestId);
    conn.pc = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) window.TreeApp.storage.pushIce('room-' + state.roomId + '-ice-host-' + guestId, e.candidate.toJSON());
    };

    const dc = pc.createDataChannel('ops');
    conn.dc = dc;
    dc.onopen = () => {
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('room_peer_connected'));
      dc.send(JSON.stringify({ type: 'tree', data: JSON.stringify(state.tree) }));
      this.updateRoomStatusHost();
    };
    dc.onclose = () => this.updateRoomStatusHost();
    dc.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'tree') {
          state.tree = JSON.parse(msg.data);
          window.TreeApp.render.renderTree();
          window.TreeApp.storage.save();
          this.broadcastToGuests(guestId);
        }
      } catch (err) { console.error(err); }
    };
    pc.onconnectionstatechange = () => this.updateRoomStatusHost();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await window.TreeApp.storage.sigWrite('room-' + state.roomId + '-offer-' + guestId, pc.localDescription);

    const answerTimer = setInterval(async () => {
      const ans = await window.TreeApp.storage.sigRead('room-' + state.roomId + '-answer-' + guestId);
      if (ans && !pc.currentRemoteDescription) {
        try { await pc.setRemoteDescription(ans); clearInterval(answerTimer); }
        catch (e) { console.error(e); }
      }
    }, 1000);
    conn.timers.push(answerTimer);

    let iceIdx = 0;
    const iceTimer = setInterval(async () => {
      const list = (await window.TreeApp.storage.sigRead('room-' + state.roomId + '-ice-guest-' + guestId)) || [];
      for (; iceIdx < list.length; iceIdx++) {
        try { await pc.addIceCandidate(list[iceIdx]); } catch (e) { console.error(e); }
      }
    }, 1000);
    conn.timers.push(iceTimer);
  },

  broadcastToGuests(excludeGuestId) {
    const state = window.TreeApp.state;
    state.hostConnections.forEach((conn, gid) => {
      if (gid === excludeGuestId) return;
      if (conn.dc && conn.dc.readyState === 'open') {
        conn.dc.send(JSON.stringify({ type: 'tree', data: JSON.stringify(state.tree) }));
      }
    });
  },

  updateRoomStatusHost() {
    const state = window.TreeApp.state;
    const total = state.hostConnections.size;
    let connected = 0;
    state.hostConnections.forEach(c => { if (c.dc && c.dc.readyState === 'open') connected++; });
    window.TreeApp.elements.roomStatus.innerHTML = '<span class="dot"></span> ' + window.TreeApp.i18n.t('room_host_status') + ' <code>' + state.roomId + '</code> — ' + connected + '/' + total + ' người đang kết nối P2P.';
  },

  hostLostHandled: false,
  
  handleHostLost() {
    const state = window.TreeApp.state;
    if (state.role !== 'guest' || this.hostLostHandled) return;
    this.hostLostHandled = true;
    const lostRoomId = state.roomId;
    window.TreeApp.elements.roomStatus.textContent = window.TreeApp.i18n.t('room_host_lost');
    setTimeout(() => {
      const wantsTakeover = confirm(window.TreeApp.i18n.t('room_host_lost_confirm'));
      if (wantsTakeover) {
        this.cleanupConnections();
        state.roomId = lostRoomId;
        state.role = 'host';
        window.TreeApp.elements.roomInput.value = state.roomId;
        window.TreeApp.elements.roomStatus.innerHTML = '<span class="dot"></span> ' + window.TreeApp.i18n.t('room_host_new_waiting', { roomId: state.roomId });
        window.TreeApp.utils.updateShareLinkVisibility();
        window.TreeApp.utils.updateUrlWithRoom();
        window.TreeApp.storage.sigWrite('room-' + state.roomId + '-guests', []).then(() => {
          window.TreeApp.storage.save();
          this.startHostListening();
          this.hostLostHandled = false;
        });
      } else {
        this.cleanupConnections();
        window.TreeApp.elements.roomStatus.textContent = window.TreeApp.i18n.t('room_left', { roomId: lostRoomId });
        this.hostLostHandled = false;
      }
    }, 100);
  },

  async becomeGuestAndConnect(targetRoomId) {
    const state = window.TreeApp.state;
    state.roomId = targetRoomId;
    state.role = 'guest';
    state.myGuestId = window.TreeApp.utils.uid();
    await window.TreeApp.storage.sigPushToList('room-' + state.roomId + '-guests', state.myGuestId);

    const pc = new RTCPeerConnection(state.RTC_CONFIG);
    state.guestConn = { pc, dc: null, timers: [] };

    pc.onicecandidate = (e) => {
      if (e.candidate) window.TreeApp.storage.pushIce('room-' + state.roomId + '-ice-guest-' + state.myGuestId, e.candidate.toJSON());
    };
    pc.ondatachannel = (e) => {
      const dc = e.channel;
      state.guestConn.dc = dc;
      dc.onopen = () => {
        window.TreeApp.elements.roomStatus.innerHTML = '<span class="dot"></span> ' + window.TreeApp.i18n.t('room_connected_to') + ' <code>' + state.roomId + '</code>';
      };
      dc.onclose = () => { this.handleHostLost(); };
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'tree') { 
            state.tree = JSON.parse(msg.data); 
            window.TreeApp.render.renderTree(); 
            window.TreeApp.storage.save(); 
          }
        } catch (err) { console.error(err); }
      };
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('room_conn_failed')); this.handleHostLost(); }
      if (pc.connectionState === 'disconnected') { this.handleHostLost(); }
    };

    window.TreeApp.elements.roomStatus.innerHTML = '<span class="dot"></span> ' + window.TreeApp.i18n.t('room_connecting', { roomId: state.roomId });

    const offerTimer = setInterval(async () => {
      const offer = await window.TreeApp.storage.sigRead('room-' + state.roomId + '-offer-' + state.myGuestId);
      if (offer && !pc.currentRemoteDescription) {
        try {
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await window.TreeApp.storage.sigWrite('room-' + state.roomId + '-answer-' + state.myGuestId, pc.localDescription);
          clearInterval(offerTimer);
        } catch (e) { console.error(e); }
      }
    }, 1000);
    state.guestConn.timers.push(offerTimer);

    let iceIdx = 0;
    const iceTimer = setInterval(async () => {
      const list = (await window.TreeApp.storage.sigRead('room-' + state.roomId + '-ice-host-' + state.myGuestId)) || [];
      for (; iceIdx < list.length; iceIdx++) {
        try { await pc.addIceCandidate(list[iceIdx]); } catch (e) { console.error(e); }
      }
    }, 1000);
    state.guestConn.timers.push(iceTimer);
  },

  sendTreeToHost() {
    const state = window.TreeApp.state;
    if (state.guestConn && state.guestConn.dc && state.guestConn.dc.readyState === 'open') {
      state.guestConn.dc.send(JSON.stringify({ type: 'tree', data: JSON.stringify(state.tree) }));
    }
  },

  broadcastTreeChange() {
    const state = window.TreeApp.state;
    if (state.role === 'host') this.broadcastToGuests();
    else if (state.role === 'guest') this.sendTreeToHost();
  }
};
