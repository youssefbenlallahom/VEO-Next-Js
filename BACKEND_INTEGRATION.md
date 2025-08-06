# Backend API Integration

This document explains how to integrate your Python backend API endpoints with the Next.js frontend.

## Setup

1. **Environment Configuration**
   - Copy `.env.local` and update the `NEXT_PUBLIC_API_URL` to point to your Python backend
   - Default: `http://localhost:8000`

2. **Start Your Backend**
   - Make sure your Python FastAPI backend is running on the configured URL
   - Ensure all the endpoints listed below are available

## Available API Endpoints

### 1. Database Statistics
- **Endpoint**: `GET /stats`
- **Purpose**: Get overall database statistics for dashboard
- **Response**: Total reports, unique candidates, job positions, average scores, top candidates, recent activity

### 2. Search Candidates
- **Endpoint**: `GET /candidates/search`
- **Purpose**: Search candidates with various filters
- **Parameters**: 
  - `name` (optional): Candidate name filter
  - `min_score` (optional): Minimum score filter
  - `max_score` (optional): Maximum score filter
  - `job_title` (optional): Job title filter
  - `limit` (optional): Results limit (default: 50)

### 3. Top Performers
- **Endpoint**: `GET /candidates/top-performers`
- **Purpose**: Get top performing candidates
- **Parameters**:
  - `limit` (optional): Number of results (default: 10)
  - `job_title` (optional): Filter by specific job title

### 4. Compare Candidates
- **Endpoint**: `GET /reports/compare`
- **Purpose**: Compare multiple candidates side by side
- **Parameters**:
  - `candidate_ids`: Comma-separated list of report IDs

### 5. Job Positions
- **Endpoint**: `GET /job-positions`
- **Purpose**: Get all unique job positions with statistics
- **Response**: Job titles with candidate counts and score statistics

### 6. Delete Report
- **Endpoint**: `DELETE /reports/{report_id}`
- **Purpose**: Delete a specific report by ID

## Frontend Components

### 1. Reports Dashboard (`/reports`)
Navigate to the Reports & Analytics page to access:

- **Overview Tab**: Database statistics and key metrics
- **Search Tab**: Advanced candidate search with filters
- **Top Performers Tab**: View highest scoring candidates
- **Compare Tab**: Side-by-side candidate comparison
- **Analytics Tab**: (Coming soon) Advanced charts and insights

### 2. API Service (`lib/api-service.ts`)
Centralized API service handling all backend communication:

```typescript
import { apiService } from '@/lib/api-service'

// Get database stats
const stats = await apiService.getDatabaseStats()

// Search candidates
const results = await apiService.searchCandidates({
  name: 'John',
  min_score: 80,
  job_title: 'Developer'
})

// Compare candidates
const comparison = await apiService.compareCandidates([1, 5, 10])
```

### 3. Custom Hooks (`hooks/use-backend-api.ts`)
React hooks for easy data fetching:

```typescript
import { useDatabaseStats, useCandidateSearch, useTopPerformers } from '@/hooks/use-backend-api'

// In your component
const { stats, loading, error } = useDatabaseStats()
const { candidates, search } = useCandidateSearch()
const { topPerformers } = useTopPerformers(10, 'Developer')
```

## Data Models

### CandidateReport
```typescript
interface CandidateReport {
  id: number
  candidate_name: string
  applied_job_title: string
  total_weighted_score: number
  strengths: string[]
  gaps: string[]
  score_details: any
  created_at: string
}
```

### DatabaseStats
```typescript
interface DatabaseStats {
  total_reports: number
  unique_candidates: number
  unique_job_positions: number
  average_score: number
  top_candidates: Array<{ name: string; score: number }>
  recent_activity: Array<{
    id: number
    candidate_name: string
    job_title: string
    score: number
    date: string
  }>
}
```

## Error Handling

All API calls include proper error handling:
- Loading states while fetching data
- Error messages for failed requests
- Retry functionality for failed operations
- Fallback UI for empty states

## CORS Configuration

Make sure your Python backend allows CORS requests from your frontend domain. Add these headers to your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Development Workflow

1. Start your Python backend (usually `uvicorn main:app --reload`)
2. Start the Next.js frontend (`npm run dev`)
3. Navigate to `/reports` to test the integration
4. Use the various tabs to test different API endpoints

## Troubleshooting

- **Connection Refused**: Check if your backend is running on the correct port
- **CORS Errors**: Verify CORS configuration in your Python backend
- **404 Errors**: Ensure all API endpoints are implemented in your backend
- **Data Format Errors**: Verify your backend returns data in the expected format

## Next Steps

You can extend this integration by:
1. Adding more chart components to the Analytics tab
2. Implementing real-time updates with WebSockets
3. Adding export functionality for reports
4. Creating custom dashboards for different user roles
