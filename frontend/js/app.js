const token    = localStorage.getItem('token');
const username = localStorage.getItem('username');
const role     = localStorage.getItem('role');

if (!token) window.location.href = 'index.html';

// Show user info
document.getElementById('display-username').textContent = username;
document.getElementById('display-role').textContent     = role;
document.getElementById('user-avatar').textContent      = username[0].toUpperCase();

// Avatar color based on role
const avatarColors = { admin: '#ed4245', moderator: '#faa81a', user: '#5865f2' };
document.getElementById('user-avatar').style.background = avatarColors[role] || '#5865f2';

// Connect socket
const socket = io('http://localhost:5000', { transports: ['websocket'] });

socket.on('connect', () => console.log('Connected ✅'));

let currentRoom = null;

// Random avatar colors for other users
function getColor(name) {
  const colors = ['#5865f2','#ed4245','#faa81a','#23a55a','#eb459e','#3ba55c'];
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function joinRoom(roomId, el) {
  currentRoom = roomId;

  document.getElementById('room-title').textContent   = roomId;
  document.getElementById('room-topic').textContent   = `Welcome to #${roomId}`;
  document.getElementById('messages').innerHTML       = '';
  document.getElementById('msg-input').disabled       = false;
  document.getElementById('msg-input').placeholder    = `Message #${roomId}`;
  document.getElementById('msg-input').focus();

  // Active room highlight
  document.querySelectorAll('.channel-item').forEach(r => r.classList.remove('active'));
  if (el) el.classList.add('active');

  socket.emit('join-room', { roomId, username, role });
  addDateDivider('Today');
}

function sendMessage() {
  const input   = document.getElementById('msg-input');
  const message = input.value.trim();
  if (!message || !currentRoom) return;

  socket.emit('send-message', { roomId: currentRoom, message, username, role });
  input.value = '';
}

document.getElementById('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

// ── Incoming events ──────────────────────────

socket.on('receive-message', ({ username: sender, message }) => {
  addMessage(sender, message);
});

socket.on('user-joined', ({ username: who, role: whoRole }) => {
  addSystemMessage(`${who} joined the room`);
  addMember(who, whoRole || 'user');
});

socket.on('announcement', ({ text }) => {
  addAnnouncement(text);
});

socket.on('user-kicked', ({ username: who }) => {
  if (who === username) {
    alert('You have been kicked from this room!');
    window.location.href = 'index.html';
  } else {
    addSystemMessage(`${who} was kicked`);
    removeMember(who);
  }
});

socket.on('error-msg', msg => {
  addSystemMessage('⚠️ ' + msg);
});

// ── Render helpers ───────────────────────────

let lastAuthor = null;

function addMessage(sender, message) {
  const msgs = document.getElementById('messages');

  if (sender === lastAuthor) {
    // Continued message — no avatar
    const div = document.createElement('div');
    div.classList.add('msg-continued');
    div.innerHTML = `
      <div class="spacer"></div>
      <div class="msg-text">${message}</div>
    `;
    msgs.appendChild(div);
  } else {
    // New message group with avatar
    const div = document.createElement('div');
    div.classList.add('msg-group');
    const roleClass = sender === username ? role : '';
    const pill = (roleClass === 'admin' || roleClass === 'moderator')
      ? `<span class="role-pill ${roleClass}">${roleClass}</span>` : '';

    const isMine       = sender === username;
const bubbleClass  = isMine ? 'mine' : (roleClass || 'user');

div.innerHTML = `
    <div class="msg-avatar" style="background:${getColor(sender)}">${sender[0].toUpperCase()}</div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-author ${roleClass}">${sender}</span>
        ${pill}
        <span class="msg-time">${getTime()}</span>
      </div>
      <div class="msg-bubble ${bubbleClass}">${message}</div>
    </div>
  `;
    msgs.appendChild(div);
    lastAuthor = sender;
  }

  scrollToBottom();
}

function addSystemMessage(text) {
  const msgs = document.getElementById('messages');
  const div  = document.createElement('div');
  div.classList.add('system-msg');
  div.textContent = text;
  msgs.appendChild(div);
  lastAuthor = null;
  scrollToBottom();
}

function addAnnouncement(text) {
  const msgs = document.getElementById('messages');
  const div  = document.createElement('div');
  div.classList.add('announcement-msg');
  div.textContent = '📢 ' + text;
  msgs.appendChild(div);
  lastAuthor = null;
  scrollToBottom();
}

function addDateDivider(text) {
  const msgs = document.getElementById('messages');
  const div  = document.createElement('div');
  div.classList.add('system-msg');
  div.textContent = text;
  msgs.appendChild(div);
}

function scrollToBottom() {
  const msgs = document.getElementById('messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Members panel ────────────────────────────

function addMember(name, memberRole) {
  const panel = document.getElementById('members-panel');

  // Clear "join a room" placeholder if it's there
  const placeholder = panel.querySelector('div[style]');
  if (placeholder) placeholder.remove();

  // Don't add duplicates
  if (document.getElementById('member-' + name)) return;

  const sectionId = 'section-' + memberRole;
  let section = document.getElementById(sectionId);

  if (!section) {
    const heading = document.createElement('div');
    heading.classList.add('members-section');
    heading.id          = sectionId;
    heading.textContent = memberRole.toUpperCase() + 'S';
    panel.appendChild(heading);
  }

  const div = document.createElement('div');
  div.classList.add('member-item');
  div.id = 'member-' + name;
  div.innerHTML = `
    <div class="member-avatar" style="background:${getColor(name)}">
      ${name[0].toUpperCase()}
      <div class="status-dot online"></div>
    </div>
    <div>
      <div class="member-name">${name}</div>
      <div class="member-role">${memberRole}</div>
    </div>
  `;
  panel.appendChild(div);
}

function removeMember(name) {
  const el = document.getElementById('member-' + name);
  if (el) el.remove();
}

// Add yourself to members on load
addMember(username, role);

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// ── FLOATING DM POPUP ─────────────────────

const openDMs = {}; // tracks open DM windows

function addToDMList(name, memberRole) {
  if (name === username) return;

  const dmList = document.getElementById('dm-list');
  if (!dmList) return;

  // remove placeholder
  const placeholder = dmList.querySelector('div[style]');
  if (placeholder) placeholder.remove();

  // no duplicates
  if (document.getElementById('dmlist-' + name)) return;

  const div = document.createElement('div');
  div.classList.add('dm-list-item');
  div.id = 'dmlist-' + name;
  div.onclick = () => openDMPopup(name);

  div.innerHTML = `
    <div class="dm-list-avatar" style="background:${getColor(name)}">
      ${name[0].toUpperCase()}
    </div>
    <span>${name}</span>
  `;

  dmList.appendChild(div);
}

function openDMPopup(dmUser) {
  // if already open just focus it
  if (openDMs[dmUser]) {
    const existing = document.getElementById('dm-popup-' + dmUser);
    if (existing) existing.classList.remove('minimized');
    return;
  }

  openDMs[dmUser] = true;

  const roomId = `dm_${[username, dmUser].sort().join('_')}`;

  // join the private room
  socket.emit('join-room', { roomId, username });

  const popup = document.createElement('div');
  popup.classList.add('dm-popup');
  popup.id = 'dm-popup-' + dmUser;

  popup.innerHTML = `
    <div class="dm-popup-header" onclick="toggleDMMinimize('${dmUser}')">
      <div class="dm-popup-avatar" style="background:${getColor(dmUser)}">
        ${dmUser[0].toUpperCase()}
      </div>
      <span class="dm-popup-name">${dmUser}</span>
      <div class="dm-popup-actions">
        <button class="dm-popup-btn" onclick="event.stopPropagation(); toggleDMMinimize('${dmUser}')">─</button>
        <button class="dm-popup-btn" onclick="event.stopPropagation(); closeDMPopup('${dmUser}')">✕</button>
      </div>
    </div>

    <div class="dm-popup-messages" id="dm-msgs-${dmUser}">
      <div class="dm-date-divider">Today</div>
    </div>

    <div class="dm-popup-input-area">
      <input
        class="dm-popup-input"
        id="dm-input-${dmUser}"
        placeholder="Message ${dmUser}..."
        onkeydown="if(event.key==='Enter') sendDM('${dmUser}')"
      />
      <button class="dm-send-btn" onclick="sendDM('${dmUser}')">➤</button>
    </div>
  `;

  document.getElementById('dm-popups').appendChild(popup);
}

function toggleDMMinimize(dmUser) {
  const popup = document.getElementById('dm-popup-' + dmUser);
  if (popup) popup.classList.toggle('minimized');
}

function closeDMPopup(dmUser) {
  const popup = document.getElementById('dm-popup-' + dmUser);
  if (popup) popup.remove();
  delete openDMs[dmUser];
}

function sendDM(dmUser) {
  const input   = document.getElementById('dm-input-' + dmUser);
  const message = input.value.trim();
  if (!message) return;

  const roomId = `dm_${[username, dmUser].sort().join('_')}`;

  // show instantly on your side
  addDMMessage(dmUser, username, message);

  // send through socket
  socket.emit('send-message', {
    roomId,
    message,
    username,
    role,
    isDM: true
  });

  input.value = '';
}

function addDMMessage(dmUser, sender, message) {
  const msgs    = document.getElementById('dm-msgs-' + dmUser);
  if (!msgs) return;

  const isMine  = sender === username;
  const div     = document.createElement('div');
  div.classList.add('dm-msg', isMine ? 'mine' : 'theirs');

  div.innerHTML = `
    ${!isMine ? `<span class="dm-msg-sender">${sender}</span>` : ''}
    <div class="dm-msg-bubble">${message}</div>
    <span class="dm-msg-time">${getTime()}</span>
  `;

  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// listen for incoming DMs
socket.on('receive-message', ({ username: sender, message, roomId }) => {
  // check if it's a DM
  if (roomId && roomId.startsWith('dm_')) {
    const otherUser = roomId
      .replace('dm_', '')
      .replace(username, '')
      .replace('_', '');

    // open popup if not open
    if (!openDMs[otherUser]) openDMPopup(otherUser);

    // don't double-show your own messages
    if (sender !== username) addDMMessage(otherUser, sender, message);
    return;
  }

  // otherwise it's a normal channel message
  addMessage(sender, message);
});