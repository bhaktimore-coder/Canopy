# 🌿 Canopy — Internal Messaging Platform

Canopy is a real-time internal messaging platform built for distributed teams. 
Think of it like your own private Discord — but with a hierarchy that actually 
means something. Admins sit at the top of the canopy, moderators manage the 
branches, and members are the leaves that make it all come alive.

Built in a hackathon. Powered by caffeine and chaos. 🍃

---

## 🌳 What it does

- **Real-time messaging** — messages appear instantly across all connected clients
- **Role-based access control** — admin, moderator, and member roles each have different powers
- **Multiple chat rooms** — join and switch between channels freely
- **Direct messaging** — private floating DM popups between users
- **Slash commands** — type `/kick username` or `/users` to extend the platform
- **JWT authentication** — secure login and registration system
- **Beautiful UI** — Discord-inspired light green theme with a tree/canopy aesthetic

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |

---

## 👥 Roles & Permissions

| Role | Powers |
|------|--------|
| **Admin** | Kick users, make announcements, manage rooms |
| **Moderator** | Kick users, manage conversations |
| **Member** | Send messages, join rooms, DM others |

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- PostgreSQL installed and running
- pgAdmin (optional but helpful)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd chatapp
```

### 2. Set up the backend
```bash
cd backend
npm install
```

### 3. Create your `.env` file
Create a file called `.env` inside the `backend` folder:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost/internal_network
JWT_SECRET=supersecretkey123
PORT=3000
```

### 4. Set up the database
Open pgAdmin and run the SQL schema:
```sql
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'member');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role DEFAULT 'member'
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  created_by INT REFERENCES users(id)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id),
  user_id INT REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Run the backend
```bash
node server.js
```

You should see:
```
🚀 Server running on port 3000
✅ Database connected
```

### 6. Open the frontend
Open `frontend/index.html` with Live Server in VS Code
or just drag and drop it into your browser!

---

## 🔌 API Routes

| Method | Route | What it does |
|--------|-------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get a JWT token |
| GET | `/rooms` | Get all available rooms |
| POST | `/rooms/create` | Create a new room |
| GET | `/rooms/users` | Get all users |

---

## ⚡ Socket Events

### Client → Server
| Event | Payload | What it does |
|-------|---------|-------------|
| `register` | — | Registers user's personal socket channel |
| `join_room` | `roomId` | Join a chat room |
| `leave_room` | `roomId` | Leave a chat room |
| `send_message` | `{ roomId, message }` | Send a message to a room |
| `direct_message` | `{ toUsername, message }` | Send a private DM |

### Server → Client
| Event | Payload | What it does |
|-------|---------|-------------|
| `receive_message` | `{ user, role, message, roomId }` | Receive a room message |
| `receive_dm` | `{ from, message, timestamp }` | Receive a direct message |

---

## 💬 Slash Commands

| Command | Who can use it | What it does |
|---------|---------------|-------------|
| `/users` | Everyone | Shows how many users are in the room |
| `/kick username` | Admin, Moderator | Kicks a user from the room |

---

## 📁 Project Structure
```
chatapp/
├── frontend/
│   ├── index.html        ← login page
│   ├── chat.html         ← main chat page
│   ├── css/
│   │   └── style.css     ← all styling
│   └── js/
│       └── app.js        ← socket + chat logic
│
└── backend/
    ├── server.js         ← main entry point
    ├── db.js             ← database connection
    ├── middleware/
    │   └── auth.js       ← JWT verification
    ├── routes/
    │   ├── auth.js       ← register + login
    │   └── rooms.js      ← room management
    └── socket/
        └── handler.js    ← all socket events
```

---

## 🌿 The idea behind Canopy

Every organization has a hierarchy — but most chat tools hide it. 
Canopy makes it visible and meaningful. Just like a real canopy, 
the strongest branches (admins) support everything above, 
while the leaves (members) give the whole thing life.

Where every branch connects. 🌳


## 👩‍💻 Built by

A team of three, building under pressure, fuelled by the 
belief that internal tools don't have to be ugly. 

*Made with 💚 at a hackathon*
