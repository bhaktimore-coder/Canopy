const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const result = await db.query('SELECT * FROM rooms');
  res.json(result.rows);
});

router.get('/users', auth, async (req, res) => {
  const result = await db.query(
    'SELECT id, username, role FROM users'
  );
  res.json(result.rows);
});

router.post('/create', auth, async (req, res) => {
  const { name } = req.body;
  const { role, id } = req.user;

  if (role === 'member') {
    return res.status(403).json({ error: 'Only admin/moderator can create rooms' });
  }

  try {
    const result = await db.query(
      `INSERT INTO rooms (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name, id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(400).json({ error: 'Room already exists' });
  }
});

module.exports = router;