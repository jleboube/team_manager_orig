# Baseball Team Manager - Production Deployment

A complete baseball team management application similar to GameChanger, built with React, Node.js, PostgreSQL, and Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed on your VM
- At least 2GB RAM and 10GB storage
- Open ports 80, 443, 3000, 3001, 5432

### Deployment

1. **Clone/Download the project files to your VM**
2. **Navigate to the project directory**
3. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Manual Deployment

If you prefer manual deployment:

```bash
# 1. Start the services
docker-compose up --build -d

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f
```

## 📱 Access the Application

- **Frontend**: http://your-vm-ip/
- **API**: http://your-vm-ip/api/
- **Health Check**: http://your-vm-ip/api/health

### Default Login Credentials

- **Coach/Admin**: coach@team.com / password
- **Player**: player@team.com / password  
- **Parent**: parent@team.com / password
- **Registration Code**: TEAM123

## 🛠️ Management Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Update application
git pull  # if using git
docker compose down
docker compose up --build -d

# Backup database
docker exec baseball_db pg_dump -U baseball_user baseball_manager > backup.sql

# Restore database
docker exec -i baseball_db psql -U baseball_user baseball_manager < backup.sql
```

## 🔧 Configuration

### Environment Variables (.env)
- `DB_NAME`: Database name
- `DB_USER`: Database username  
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT tokens

### Security Notes
1. Change default passwords in `.env` file
2. Use SSL certificates for production (add to nginx config)
3. Configure firewall to only allow necessary ports
4. Regular database backups recommended

## 📊 Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Nginx     │────│   React     │────│   Node.js   │
│   Proxy     │    │   Frontend  │    │   Backend   │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                    ┌─────────────┐
                                    │ PostgreSQL  │
                                    │  Database   │
                                    └─────────────┘
```

## 🎯 Features

✅ **Authentication & User Management**
- JWT-based authentication
- Role-based access control
- Team invitation system

✅ **Team & Roster Management**  
- Player management with positions
- Jersey number assignment
- Team statistics

✅ **Schedule & Game Management**
- Game scheduling
- Score tracking
- Status management

✅ **Statistics Tracking**
- Individual player stats
- Season aggregates
- Exportable reports

✅ **Media Management**
- Image and video uploads
- Game-specific media
- Secure file storage

✅ **Security**
- Password hashing (bcrypt)
- Input validation
- Rate limiting
- CORS protection

## 🐛 Troubleshooting

### Services won't start
```bash
docker compose logs
docker system prune -f
docker compose up --build -d
```

### Database connection issues
```bash
docker compose exec database psql -U baseball_user -d baseball_manager
```

### Permission issues
```bash
sudo chown -R 1000:1000 uploads/
sudo chown -R 999:999 postgres_data/
```

## 📈 Monitoring

Monitor your application:
- Health check: `curl http://localhost/api/health`
- Database status: `docker-compose exec database pg_isready`
- View resource usage: `docker stats`

---

**🏆 Your baseball team management application is ready to play ball!**