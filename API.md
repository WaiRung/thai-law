# API Integration Guide

This document describes how to integrate the Thai Law Flashcard app with a backend API.

## Overview

The app now supports loading category data from an API endpoint. If the API is not configured or fails to load, the app will automatically fall back to the static data defined in `src/data/categoryStores.ts`.

## Configuration

To enable API integration, create a `.env` file in the project root with the following configuration:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

You can copy `.env.example` as a starting point:

```bash
cp .env.example .env
```

## API Endpoints

### 1. Get All Categories

**Endpoint:** `GET /categories`

**Response Format:**
```json
[
  {
    "id": "กฎหมายแพ่ง",
    "nameTh": "กฎหมายแพ่ง",
    "nameEn": "Civil & Commercial Law",
    "icon": "⚖️",
    "questions": [
      {
        "id": 1,
        "question": "ประมวลกฎหมายแพ่งและพาณิชย์ คืออะไร?",
        "answer": "เป็นกฎหมายที่ว่าด้วยความสัมพันธ์ระหว่างบุคคลธรรมดาหรือนิติบุคคล..."
      }
    ]
  }
]
```

**Response Fields:**
- `id` (string): Unique identifier for the category
- `nameTh` (string): Category name in Thai
- `nameEn` (string): Category name in English
- `icon` (string): Emoji icon for the category
- `questions` (array): Array of flashcard questions for this category
  - `id` (number): Unique identifier for the question
  - `question` (string): The question text
  - `answer` (string): The answer text

### 2. Get Category by ID (Optional)

**Endpoint:** `GET /categories/:categoryId`

**Response Format:**
```json
{
  "id": "กฎหมายแพ่ง",
  "nameTh": "กฎหมายแพ่ง",
  "nameEn": "Civil & Commercial Law",
  "icon": "⚖️",
  "questions": [
    {
      "id": 1,
      "question": "ประมวลกฎหมายแพ่งและพาณิชย์ คืออะไร?",
      "answer": "เป็นกฎหมายที่ว่าด้วยความสัมพันธ์ระหว่างบุคคลธรรมดาหรือนิติบุคคล..."
    }
  ]
}
```

**Note:** This endpoint is implemented in the API service but not currently used by the app. All categories are loaded at once on app initialization.

## Error Handling

The app implements graceful error handling:

1. **API Not Configured**: If `VITE_API_BASE_URL` is not set, the app logs a warning and uses static data
2. **Network Errors**: If the API request fails (timeout, network error, etc.), the app falls back to static data
3. **Invalid Response**: If the API returns invalid data, the app falls back to static data

All errors are logged to the browser console for debugging.

## Implementation Details

### API Service (`src/services/api.ts`)

The API service provides two main functions:

- `fetchCategories()`: Fetches all categories from the API
- `fetchCategoryById(categoryId)`: Fetches a specific category by ID

Both functions include:
- 10-second timeout
- Abort controller for request cancellation
- Proper error handling
- Response validation

### Loading States

The app displays different UI states:

- **Loading**: Shows a spinner with "กำลังโหลดหมวดหมู่..." message
- **Error**: Shows an error message with a retry button
- **Loaded**: Shows the category selection interface

### Components

Two new components were added to handle loading and error states:

- `LoadingSpinner.vue`: Displays a loading spinner with customizable message
- `ErrorMessage.vue`: Displays error messages with optional retry functionality

## Testing

### Test with Static Data (Default)

Without setting `VITE_API_BASE_URL`, the app will use static data:

```bash
yarn dev
```

### Test with API

1. Set up your backend API
2. Configure the `.env` file with your API URL
3. Start the development server:

```bash
yarn dev
```

The app will attempt to load from the API and fall back to static data if it fails.

## CORS Configuration

Make sure your API server is configured to accept requests from your frontend domain. Example CORS headers:

```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Future Enhancements

Possible improvements for the API integration:

1. **Caching**: Implement local storage caching to reduce API calls
2. **Lazy Loading**: Load category questions only when a category is selected
3. **Pagination**: Support paginated responses for large datasets
4. **Search**: Add API endpoints for searching flashcards
5. **User Progress**: Sync user progress with the backend
6. **Authentication**: Add user authentication for personalized experiences

## TypeScript Types

The app uses the following TypeScript interfaces defined in `src/types/flashcard.ts`:

```typescript
export interface Flashcard {
  id: number;
  question: string;
  answer: string;
}

export interface CategoryStore {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  questions: Flashcard[];
}
```

Make sure your API responses match these types for proper TypeScript support.
