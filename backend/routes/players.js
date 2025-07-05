const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const router = express.Router();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Get players for user's teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.* FROM players p
      JOIN teams t ON p.team_id = t.id
      JOIN team_memberships tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Add player (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { teamId, name, jerseyNumber, position, role, email } = req.body;

    // Check if user is admin of this team
    const teamCheck = await pool.query(
      'SELECT id FROM teams WHERE id = $1 AND admin_id = $2',
      [teamId, req.user.userId]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to add players to this team' });
    }

    const result = await pool.query(
      'INSERT INTO players (team_id, name, jersey_number, position, role, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [teamId, name, jerseyNumber, position, role, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding player:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Jersey number already taken' });
    } else {
      res.status(500).json({ error: 'Failed to add player' });
    }
  }
});

module.exports = router;
