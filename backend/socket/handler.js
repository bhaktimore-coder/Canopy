const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`${socket.user.username} connected`);

    socket.on('register', () => {
      socket.join(`user:${socket.user.username}`);
    });

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      io.to(roomId).emit('receive_message', {
        user: 'system',
        message: `${socket.user.username} joined the room`
      });
    });

    socket.on('send_message', ({ roomId, message }) => {
      if (message.startsWith('/')) {
        handleCommand(message, socket, io, roomId);
        return;
      }
      io.to(roomId).emit('receive_message', {
        user: socket.user.username,
        role: socket.user.role,
        message,
        roomId
      });
    });

    socket.on('direct_message', ({ toUsername, message }) => {
      io.to(`user:${toUsername}`).emit('receive_dm', {
        from: socket.user.username,
        message,
        timestamp: new Date()
      });
      socket.emit('receive_dm', {
        from: socket.user.username,
        to: toUsername,
        message,
        timestamp: new Date()
      });
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit('receive_message', {
        user: 'system',
        message: `${socket.user.username} left the room`
      });
    });

    socket.on('disconnect', () => {
      console.log(`${socket.user.username} disconnected`);
    });
  });
};

function handleCommand(msg, socket, io, roomId) {
  const [command, ...args] = msg.split(' ');
  switch (command) {
    case '/users':
      const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      socket.emit('receive_message', {
        user: 'system',
        message: `${count} user(s) currently in this room`
      });
      break;
    case '/kick':
      if (socket.user.role === 'member') {
        socket.emit('receive_message', {
          user: 'system', message: 'No permission to kick'
        });
      } else {
        io.to(roomId).emit('receive_message', {
          user: 'system', message: `${args[0]} was kicked`
        });
      }
      break;
    default:
      socket.emit('receive_message', {
        user: 'system', message: `Unknown command: ${command}`
      });
  }
}