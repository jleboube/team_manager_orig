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

// Get games for user's teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.* FROM games g
      JOIN teams t ON g.team_id = t.id
      JOIN team_memberships tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY g.game_date DESC, g.game_time DESC
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Add game (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { teamId, opponent, gameDate, gameTime, location, homeAway } = req.body;

    // Check if user is admin of this team
    const teamCheck = await pool.query(
      'SELECT id FROM teams WHERE id = $1 AND admin_id = $2',
      [teamId, req.user.userId]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to add games to this team' });
    }

    const result = await pool.query(
      'INSERT INTO games (team_id, opponent, game_date, game_time, location, home_away) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [teamId, opponent, gameDate, gameTime, location, homeAway]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ error: 'Failed to add game' });
  }
});

module.exports = router;