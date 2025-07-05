const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
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

// Get media for user's teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.* FROM media m
      JOIN teams t ON m.team_id = t.id
      JOIN team_memberships tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY m.created_at DESC
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Upload media (admin only)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can upload media' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { teamId, gameId, title, description } = req.body;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      'INSERT INTO media (team_id, game_id, title, description, file_type, file_url, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [teamId, gameId || null, title, description, fileType, fileUrl, req.file.size, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

module.exports = router;
