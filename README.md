# WinkuNanu Mobile App

A React Native mobile application for the WinkuNanu social media platform, built with Expo.

## Features

- **Authentication**: Login and registration with real API integration
- **Token Management**: Automatic token refresh and secure storage
- **Modern UI**: Beautiful gradient design with form validation
- **TypeScript**: Full type safety throughout the application

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (for testing)

## Setup Instructions

### 1. Install Dependencies

```bash
cd WinkuNanuMobile/WinkuNanuMobile
npm install
```

### 2. Install Additional Dependencies

```bash
npm install axios @react-native-async-storage/async-storage jwt-decode
```

### 3. Configure API Base URL

Update the base URL in `utils/axiosInstance.ts` to point to your backend:

```typescript
const api = axios.create({
  baseURL: 'http://your-backend-url:8080', // Update this
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 4. Start the Development Server

```bash
npx expo start
```

### 5. Test the App

- Scan the QR code with Expo Go app (iOS/Android)
- Or press 'a' for Android emulator or 'i' for iOS simulator

## Project Structure

```
WinkuNanuMobile/
├── app/
│   ├── auth/
│   │   └── login.tsx          # Login/Register screen
│   ├── _layout.tsx            # Root layout
│   └── index.tsx              # Entry point
├── utils/
│   ├── apiService.ts          # API functions
│   ├── axiosInstance.ts       # Axios configuration
│   └── tokenUtils.ts          # Token management
├── assets/                    # Images, fonts, etc.
└── package.json
```

## API Integration

The app includes comprehensive API integration with:

- **Authentication**: Login, register, logout, token refresh
- **User Management**: Profile fetch/update, user search
- **Posts**: Create, like, comment, fetch feeds
- **Social**: Follow/unfollow, check follow status
- **Chat**: Conversations, messages
- **Images**: Upload, fetch pictures

## Token Management

- Automatic token storage in AsyncStorage
- Automatic token refresh on 401 errors
- Secure token handling with JWT decode
- Session management and logout functionality

## Development

### Adding New Screens

1. Create a new file in `app/` directory
2. Add the route to `_layout.tsx` if needed
3. Use the API service functions for data fetching

### API Service

All API calls are centralized in `utils/apiService.ts` with:
- TypeScript interfaces for type safety
- Consistent error handling
- Automatic token management
- Response formatting

## Troubleshooting

### Common Issues

1. **Module not found errors**: Run `npm install` to install dependencies
2. **API connection errors**: Check the base URL in `axiosInstance.ts`
3. **Token issues**: Clear app data or reinstall the app

### Backend Requirements

Ensure your backend is running and accessible at the configured URL. The app expects:
- RESTful API endpoints
- JWT token authentication
- CORS enabled for mobile requests

## Next Steps

- Add more screens (feeds, profile, chat)
- Implement push notifications
- Add offline support
- Optimize performance
- Add unit tests
