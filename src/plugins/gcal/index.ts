import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// Set credentials if refresh token is available
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

// Initialize Calendar API client
export const calendarClient = google.calendar({
  version: "v3",
  auth: oauth2Client,
});

export { oauth2Client };
console.log(calendarClient);
