import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [competitors, setCompetitors] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setCompetitors([
        { id: 1, name: 'TechCrunch', website: 'https://techcrunch.com', status: 'active' },
        { id: 2, name: 'Mashable', website: 'https://mashable.com', status: 'active' }
      ]);
      
      setTrends([
        { keyword: 'AI', trend_score: 95, growth_rate: 15 },
        { keyword: 'Remote Work', trend_score: 87, growth_rate: 8 }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading ContentHarvest AI...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>ContentHarvest AI</h1>
        <p>Competitive Intelligence & Content Strategy Platform</p>
      </header>

      <main className="dashboard">
        <section className="competitors-section">
          <h2>Competitors</h2>
          <div className="competitors-grid">
            {competitors.map(competitor => (
              <div key={competitor.id} className="competitor-card">
                <h3>{competitor.name}</h3>
                <p>{competitor.website}</p>
                <span className={`status ${competitor.status}`}>{competitor.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="trends-section">
          <h2>Trending Topics</h2>
          <div className="trends-grid">
            {trends.map((trend, index) => (
              <div key={index} className="trend-card">
                <h3>{trend.keyword}</h3>
                <div className="trend-metrics">
                  <span>Score: {trend.trend_score}</span>
                  <span>Growth: +{trend.growth_rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;