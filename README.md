# ContentHarvest AI

AI-powered competitive intelligence and content strategy platform that helps businesses monitor competitors, analyze trends, and generate content insights.

## Features

- **Competitor Monitoring**: Automatically scrape competitor websites for content analysis
- **Trend Analysis**: Track trending topics from Google Trends, social media, and news
- **AI-Powered Insights**: Generate content suggestions and performance predictions
- **Real-time Updates**: WebSocket-based live notifications
- **Asset Management**: Collect and organize competitor assets

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL database (or Supabase account)
- Redis (optional, for caching)

### Quick Start (Demo Mode)

```bash
# Clone the repository
git clone <repository-url>
cd contest-harvest-ai

# Start everything (installs dependencies automatically)
node start.js
```

### Manual Installation

1. **Install dependencies**
```bash
npm run install-all
```

2. **Start development servers**
```bash
npm run dev
```

### Production Setup

1. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your production configuration
```

2. **Setup database**
```bash
# Run migrations (if using PostgreSQL)
cd database
psql -d your_database < migrations/001_create_users.sql
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/contentharvest
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# API Keys
OPENAI_API_KEY=your-openai-api-key
NEWS_API_KEY=your-news-api-key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Competitors
- `GET /api/competitors` - List competitors
- `POST /api/competitors` - Add competitor
- `POST /api/competitors/:id/scrape` - Scrape competitor content

### Trends
- `GET /api/trends` - Get trending topics
- `GET /api/trends/search?keyword=AI` - Search specific trends

### Content Analysis
- `POST /api/ai/analyze` - Analyze content with AI

## Architecture

```
├── backend/          # Node.js/Express API
├── frontend/         # React application  
├── database/         # SQL migrations and seeds
├── configs/          # Docker and deployment configs
└── shared/           # Shared types and utilities
```

## Development

### Running Tests
```bash
npm test
```

### Code Quality
```bash
npm run lint
npm run format
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Production
See `docs/DEPLOYMENT.md` for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.