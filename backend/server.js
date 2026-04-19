const app = require('./app');
const initDatabase = require('./scripts/initDb');
require('dotenv').config();

const PORT = process.env.PORT || 8000;

// Start Server
const startServer = async () => {
  try {
    console.log('Starting Jupiter Backend...');
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
