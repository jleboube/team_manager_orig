const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setupDemo() {
  try {
    console.log('Setting up demo data...');

    // Hash the demo password
    const passwordHash = await bcrypt.hash('password', 10);

    // Insert demo users
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES 
      ('Coach Johnson', 'coach@team.com', $1, 'admin'),
      ('Mike Johnson', 'player@team.com', $1, 'player'),
      ('Parent Smith', 'parent@team.com', $1, 'parent')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash]);

    // Get the admin user ID
    const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', ['coach@team.com']);
    const adminId = adminResult.rows[0]?.id;

    if (adminId) {
      // Insert demo team
      await pool.query(`
        INSERT INTO teams (name, season, admin_id, invite_code) VALUES 
        ('Eagles Baseball', '2025 Spring', $1, 'TEAM123')
        ON CONFLICT (invite_code) DO NOTHING
      `, [adminId]);

      // Get team ID
      const teamResult = await pool.query('SELECT id FROM teams WHERE invite_code = $1', ['TEAM123']);
      const teamId = teamResult.rows[0]?.id;

      if (teamId) {
        // Add all users to the team
        const users = await pool.query('SELECT id, role FROM users WHERE email IN ($1, $2, $3)', 
          ['coach@team.com', 'player@team.com', 'parent@team.com']);

        for (const user of users.rows) {
          await pool.query(`
            INSERT INTO team_memberships (user_id, team_id, role) VALUES ($1, $2, $3)
            ON CONFLICT (user_id, team_id) DO NOTHING
          `, [user.id, teamId, user.role]);
        }

        // Add some demo players
        await pool.query(`
          INSERT INTO players (team_id, name, jersey_number, position, role, email) VALUES 
          ($1, 'Mike Johnson', 12, 'Pitcher', 'Starter', 'mike.johnson@email.com'),
          ($1, 'Sarah Davis', 7, 'Shortstop', 'Starter', 'sarah.davis@email.com'),
          ($1, 'Tom Wilson', 23, 'Outfield', 'Bench', 'tom.wilson@email.com')
          ON CONFLICT (team_id, jersey_number) DO NOTHING
        `, [teamId]);

        // Add demo games
        await pool.query(`
          INSERT INTO games (team_id, opponent, game_date, game_time, location, home_away, status) VALUES 
          ($1, 'Tigers', '2025-07-10', '15:00', 'Central Park Field 1', 'home', 'upcoming'),
          ($1, 'Lions', '2025-07-05', '14:00', 'Lions Stadium', 'away', 'completed')
          ON CONFLICT DO NOTHING
        `, [teamId]);

        console.log('Demo data setup complete!');
      }
    }

  } catch (error) {
    console.error('Error setting up demo data:', error);
  } finally {
    await pool.end();
  }
}

setupDemo();