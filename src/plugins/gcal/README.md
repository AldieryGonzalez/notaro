# Google Calendar Integration

This plugin provides Google Calendar API integration for the Notaro application, allowing you to manage calendar events through AI tool calls.

## Features

- **Create Events**: Create new calendar events with title, description, start/end times, and attendees
- **List Events**: Retrieve events from calendars with filtering options
- **Update Events**: Modify existing events
- **Delete Events**: Remove events from calendars
- **Get Event Details**: Retrieve specific event information
- **List Calendars**: View all available calendars
- **Find Available Time Slots**: Discover free time slots for scheduling

## Setup

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as the application type
5. Add authorized redirect URIs (e.g., `http://localhost:3000/api/auth/callback/google`)
6. Save and note down the Client ID and Client Secret

### 3. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

### 4. Getting a Refresh Token

To get a refresh token, you'll need to implement an OAuth flow. Here's a simple way to get one:

1. Create a temporary script to generate the authorization URL:

```javascript
const { OAuth2Client } = require('google-auth-library');

const oauth2Client = new OAuth2Client(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

const scopes = ['https://www.googleapis.com/auth/calendar'];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting this url:', url);
```

2. Visit the URL, authorize the application, and get the authorization code
3. Exchange the code for tokens:

```javascript
const { tokens } = await oauth2Client.getToken(authorizationCode);
console.log('Refresh token:', tokens.refresh_token);
```

## Available Tools

### createCalendarEvent
Creates a new event in Google Calendar.

**Parameters:**
- `title` (string): Event title/summary
- `description` (string, optional): Event description
- `startDateTime` (string, optional): Start time in ISO format
- `endDateTime` (string, optional): End time in ISO format
- `calendarId` (string, optional): Calendar ID (defaults to 'primary')
- `attendees` (array, optional): Array of attendee email addresses

### listCalendarEvents
Lists events from Google Calendar.

**Parameters:**
- `calendarId` (string, optional): Calendar ID (defaults to 'primary')
- `maxResults` (number, optional): Maximum events to return (default: 10)
- `timeMin` (string, optional): Start time filter in ISO format
- `timeMax` (string, optional): End time filter in ISO format

### updateCalendarEvent
Updates an existing calendar event.

**Parameters:**
- `eventId` (string): ID of the event to update
- `title` (string, optional): New event title
- `description` (string, optional): New event description
- `startDateTime` (string, optional): New start time in ISO format
- `endDateTime` (string, optional): New end time in ISO format
- `calendarId` (string, optional): Calendar ID (defaults to 'primary')
- `attendees` (array, optional): New array of attendee emails

### deleteCalendarEvent
Deletes an event from Google Calendar.

**Parameters:**
- `eventId` (string): ID of the event to delete
- `calendarId` (string, optional): Calendar ID (defaults to 'primary')

### getCalendarEvent
Retrieves details of a specific event.

**Parameters:**
- `eventId` (string): ID of the event to retrieve
- `calendarId` (string, optional): Calendar ID (defaults to 'primary')

### listCalendars
Lists all available calendars for the authenticated user.

### findAvailableTimeSlots
Finds available time slots in a calendar.

**Parameters:**
- `duration` (number, optional): Duration in minutes (default: 60)
- `startDate` (string, optional): Start date to search from in ISO format
- `endDate` (string, optional): End date to search until in ISO format
- `calendarId` (string, optional): Calendar ID (defaults to 'primary')

## Usage Examples

The AI assistant can now handle requests like:

- "Create a meeting for tomorrow at 2 PM titled 'Team Standup'"
- "List my calendar events for this week"
- "Update the meeting with ID 'abc123' to start at 3 PM instead"
- "Delete the event with ID 'xyz789'"
- "Find available 1-hour time slots for next week"
- "Show me all my calendars"

## Error Handling

All functions include proper error handling and will log errors to the console. Make sure to check the server logs if you encounter issues with calendar operations.

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Google API credentials secure
- Use environment variables for all sensitive configuration
- Consider implementing proper user authentication for production use
