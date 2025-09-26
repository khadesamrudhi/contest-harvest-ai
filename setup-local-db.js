// Simple local database setup for development
const fs = require('fs');
const path = require('path');

// Create a simple in-memory database fallback
const createLocalDB = () => {
  const dbPath = path.join(__dirname, 'local-db.json');
  
  const initialData = {
    users: [],
    competitors: [],
    trends: [
      { id: 1, keyword: 'AI', trend_score: 95, growth_rate: 15, source: 'google_trends', created_at: new Date().toISOString() },
      { id: 2, keyword: 'Remote Work', trend_score: 87, growth_rate: 8, source: 'google_trends', created_at: new Date().toISOString() },
      { id: 3, keyword: 'Blockchain', trend_score: 78, growth_rate: 12, source: 'google_trends', created_at: new Date().toISOString() }
    ],
    scraping_jobs: [],
    assets: [],
    content: [],
    analyses: []
  };

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    console.log('Local database created at:', dbPath);
  }
  
  return dbPath;
};

if (require.main === module) {
  createLocalDB();
}

module.exports = { createLocalDB };