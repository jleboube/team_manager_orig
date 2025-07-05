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

// Get stats for user's teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ps.* FROM player_stats ps
      JOIN players p ON ps.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      JOIN team_memberships tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Add stats (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { playerId, gameId, atBats, hits, rbis, runs, strikeouts, walks, inningsPitched, earnedRuns } = req.body;

    // Check if user is admin (simplified check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add stats' });
    }

    const result = await pool.query(
      `INSERT INTO player_stats 
       (player_id, game_id, at_bats, hits, rbis, runs, strikeouts, walks, innings_pitched, earned_runs) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [playerId, gameId, atBats, hits, rbis, runs, strikeouts, walks, inningsPitched, earnedRuns]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding stats:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Stats already exist for this player and game' });
    } else {
      res.status(500).json({ error: 'Failed to add stats' });
    }
  }
});

module.exports = router;
