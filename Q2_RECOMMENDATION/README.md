# AI-Powered Product Recommendation System

A full-stack e-commerce recommendation system built with React, Node.js, Express, and PostgreSQL, featuring AI-powered personalized product recommendations.

## Features

- 🔐 Secure Authentication System
- 🛍️ Product Catalog Management
- 🎯 Personalized Recommendations
- 📊 User Interaction Tracking
- 🔄 Real-time Updates
- 📱 Responsive UI
- 🧪 Comprehensive Testing

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- React Query for data fetching
- Jest & React Testing Library
- MSW for API mocking

### Backend
- Node.js & Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Jest for testing
- Redis for caching

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   ├── types/         # TypeScript types
│   │   └── prisma/        # Database schema
│   └── tests/            # Backend tests
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── contexts/      # Global state
    │   ├── services/      # API services
    │   ├── pages/         # Route pages
    │   └── utils/         # Helper functions
    └── tests/            # Frontend tests
```

## Prerequisites
- Node.js >= 16
- Redis >= 6 (installed locally)

### Environment Variables

#### Backend (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secure-jwt-secret-key"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV="development"
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
```
REACT_APP_API_URL="http://localhost:3000"
REACT_APP_IMAGE_CDN_URL="https://your-cdn-url.com"
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up the database:
```bash
# Create the SQLite database and apply migrations
npx prisma migrate dev
npx prisma generate
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

5. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Products

#### Get Products
```http
GET /api/products?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Product Details
```http
GET /api/products/:id
Authorization: Bearer <token>
```

### Recommendations

#### Get Personalized Recommendations
```http
GET /api/recommendations/personalized
Authorization: Bearer <token>
```

#### Get Similar Products
```http
GET /api/recommendations/similar/:productId
Authorization: Bearer <token>
```

#### Get Trending Products
```http
GET /api/recommendations/trending
Authorization: Bearer <token>
```

## Database Schema

### User
- id (UUID)
- email (String, unique)
- password (String, hashed)
- name (String)
- resetToken (String, optional)
- resetTokenExpiry (DateTime, optional)
- createdAt (DateTime)
- updatedAt (DateTime)

### Product
- id (UUID)
- productId (Int, unique)
- productName (String)
- category (String)
- subcategory (String)
- price (Float)
- quantityInStock (Int)
- manufacturer (String)
- description (String)
- weight (Float)
- dimensions (String)
- releaseDate (DateTime)
- rating (Float)
- isFeatured (Boolean)
- isOnSale (Boolean)
- salePrice (Float, optional)
- imageUrl (String)
- features (Json)
- similarityVector (Float[])

### Interaction
- id (UUID)
- userId (UUID)
- productId (UUID)
- type (String)
- createdAt (DateTime)

### UserPreference
- id (UUID)
- userId (UUID)
- category (String)
- weight (Float)
- createdAt (DateTime)
- updatedAt (DateTime)

### Recommendation
- id (UUID)
- userId (UUID)
- productId (UUID)
- score (Float)
- createdAt (DateTime)

## Performance Optimizations

### Database
- Indexed fields for frequent queries
- Optimized joins and aggregations
- Connection pooling
- Query result caching

### Frontend
- Image lazy loading
- Component code splitting
- Memoized components
- CDN for static assets

### Caching
- Redis for API responses
- Browser caching
- CDN caching
- In-memory caching for recommendations

## Deployment

### Backend Deployment
1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Frontend Deployment
1. Build the application:
```bash
npm run build
```

2. Serve the static files using a web server (e.g., Nginx)

## Testing

### Running Backend Tests
```bash
cd backend
npm test
```

### Running Frontend Tests
```bash
cd frontend
npm test
```

## Security Measures

- JWT authentication
- Rate limiting
- Input validation
- XSS protection
- CSRF protection
- Secure password hashing
- HTTPS enforcement
- Security headers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 