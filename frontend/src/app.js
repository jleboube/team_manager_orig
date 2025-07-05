import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Users, BarChart3, Camera, LogOut, Plus, Edit2, Trash2, Upload, Download, Eye } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

const App = () => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', code: '', role: 'player' });
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);

  // App state
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState([]);
  const [media, setMedia] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Form states
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [showStatsForm, setShowStatsForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingGame, setEditingGame] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  // Check for existing auth token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set axios auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setCurrentUser(response.data.user);
      await loadTeamData();
    } catch (error) {
      console.error('Auth verification failed:', error);
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async () => {
    try {
      const [teamsRes, playersRes, gamesRes, statsRes, mediaRes] = await Promise.all([
        axios.get('/teams'),
        axios.get('/players'),
        axios.get('/games'),
        axios.get('/stats'),
        axios.get('/media')
      ]);

      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
      setGames(gamesRes.data);
      setStats(statsRes.data);
      setMedia(mediaRes.data);

      if (teamsRes.data.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    }
  };

  // Authentication functions
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/login', loginForm);
      const { user, token } = response.data;

      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      setLoginForm({ email: '', password: '' });
      await loadTeamData();
    } catch (error) {
      console.error('Login failed:', error);
      alert(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/register', registerForm);
      const { user, token } = response.data;

      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      setRegisterForm({ name: '', email: '', password: '', code: '', role: 'player' });
      await loadTeamData();
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setActiveTab('dashboard');
    setTeams([]);
    setPlayers([]);
    setGames([]);
    setStats([]);
    setMedia([]);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Baseball Manager...</p>
        </div>
      </div>
    );
  }

  // Login/Register Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">⚾ Team Manager</h1>
            <p className="text-gray-600">Manage your baseball team like a pro</p>
          </div>

          <div className="flex mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-center rounded-l-lg transition-colors ${
                authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-center rounded-r-lg transition-colors ${
                authMode === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          {authMode === 'login' ? (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Registration Code"
                value={registerForm.code}
                onChange={(e) => setRegisterForm({...registerForm, code: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select
                value={registerForm.role}
                onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="player">Player</option>
                <option value="parent">Parent/Viewer</option>
              </select>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p><strong>Coach:</strong> coach@team.com / password</p>
            <p><strong>Player:</strong> player@team.com / password</p>
            <p><strong>Parent:</strong> parent@team.com / password</p>
            <p><strong>Registration Code:</strong> TEAM123</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Application Dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">⚾ Team Manager</h1>
              {teams.length > 0 && (
                <div className="ml-8">
                  <select
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(Number(e.target.value))}
                    className="border rounded-lg px-3 py-1"
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentUser.name} ({currentUser.role})
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white rounded-lg shadow-sm p-6 mr-8">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'roster' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users size={20} />
                  <span>Roster</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'schedule' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Calendar size={20} />
                  <span>Schedule</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'stats' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Statistics</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'media' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Camera size={20} />
                  <span>Media</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {selectedTeam ? (
              <div>
                {/* Dashboard */}
                {activeTab === 'dashboard' && <DashboardContent teams={teams} players={players} games={games} selectedTeam={selectedTeam} />}
                
                {/* Other tabs would go here */}
                {activeTab !== 'dashboard' && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon</h3>
                    <p className="text-gray-600">This section is being built. Check back soon!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Found</h3>
                <p className="text-gray-600">Contact your coach to get added to a team.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const DashboardContent = ({ teams, players, games, selectedTeam }) => {
  const team = teams.find(t => t.id === selectedTeam);
  const teamPlayers = players.filter(p => p.team_id === selectedTeam);
  const teamGames = games.filter(g => g.team_id === selectedTeam);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Players</h3>
          <p className="text-3xl font-bold text-blue-600">{teamPlayers.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Games Played</h3>
          <p className="text-3xl font-bold text-green-600">
            {teamGames.filter(g => g.status === 'completed').length}
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Upcoming Games</h3>
          <p className="text-3xl font-bold text-purple-600">
            {teamGames.filter(g => g.status === 'upcoming').length}
          </p>
        </div>
      </div>

      {team && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to {team.name}</h3>
          <p className="text-gray-600">{team.season}</p>
        </div>
      )}

      <div className="text-center py-8 text-gray-600">
        <p>Dashboard features are loading...</p>
        <p className="text-sm mt-2">Full team management features coming soon!</p>
      </div>
    </div>
  );
};

export default App;