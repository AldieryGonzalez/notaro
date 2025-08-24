import {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  getEvent,
  listCalendars,
  findAvailableTimeSlots,
} from "./actions";
import { tool } from "ai";
import z from "zod";

export const gCalTools = {
  createCalendarEvent: tool({
    description: "Create a new event in Google Calendar",
    inputSchema: z.object({
      title: z.string().describe("The title/summary of the event"),
      description: z.string().optional().describe("Description of the event"),
      startDateTime: z
        .string()
        .optional()
        .describe("Start date and time in ISO format"),
      endDateTime: z
        .string()
        .optional()
        .describe("End date and time in ISO format"),
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary)"),
      attendees: z
        .array(z.string())
        .optional()
        .describe("Array of attendee email addresses"),
    }),
    execute: async ({
      title,
      description,
      startDateTime,
      endDateTime,
      calendarId,
      attendees,
    }) =>
      await createEvent(
        title,
        description,
        startDateTime,
        endDateTime,
        calendarId,
        attendees
      ),
  }),
  listCalendarEvents: tool({
    description: "List events from Google Calendar",
    inputSchema: z.object({
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary)"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of events to return (default 10)"),
      timeMin: z
        .string()
        .optional()
        .describe("Start time filter in ISO format"),
      timeMax: z.string().optional().describe("End time filter in ISO format"),
    }),
    execute: async ({ calendarId, maxResults, timeMin, timeMax }) =>
      await listEvents(calendarId, maxResults, timeMin, timeMax),
  }),
  updateCalendarEvent: tool({
    description: "Update an existing event in Google Calendar",
    inputSchema: z.object({
      eventId: z.string().describe("The ID of the event to update"),
      title: z.string().optional().describe("New title/summary of the event"),
      description: z
        .string()
        .optional()
        .describe("New description of the event"),
      startDateTime: z
        .string()
        .optional()
        .describe("New start date and time in ISO format"),
      endDateTime: z
        .string()
        .optional()
        .describe("New end date and time in ISO format"),
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary)"),
      attendees: z
        .array(z.string())
        .optional()
        .describe("New array of attendee email addresses"),
    }),
    execute: async ({
      eventId,
      title,
      description,
      startDateTime,
      endDateTime,
      calendarId,
      attendees,
    }) =>
      await updateEvent(
        eventId,
        { title, description, startDateTime, endDateTime, attendees },
        calendarId
      ),
  }),
  deleteCalendarEvent: tool({
    description: "Delete an event from Google Calendar",
    inputSchema: z.object({
      eventId: z.string().describe("The ID of the event to delete"),
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary)"),
    }),
    execute: async ({ eventId, calendarId }) =>
      await deleteEvent(eventId, calendarId),
  }),
  getCalendarEvent: tool({
    description: "Get details of a specific event from Google Calendar",
    inputSchema: z.object({
      eventId: z.string().describe("The ID of the event to retrieve"),
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary)"),
    }),
    execute: async ({ eventId, calendarId }) =>
      await getEvent(eventId, calendarId),
  }),
  listCalendars: tool({
    description: "List all available calendars",
    inputSchema: z.object({}),
    execute: async () => await listCalendars(),
  }),
  findAvailableTimeSlots: tool({
    description: "Find available time slots in a calendar",
    inputSchema: z.object({
      duration: z
        .number()
        .optional()
        .describe("Duration of the slot in minutes (default 60)"),
      startDate: z
        .string()
        .optional()
        .describe("Start date to search from in ISO format"),
      endDate: z
        .string()
        .optional()
        .describe("End date to search until in ISO format"),
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary)"),
    }),
    execute: async ({ duration, startDate, endDate, calendarId }) =>
      await findAvailableTimeSlots(duration, startDate, endDate, calendarId),
  }),
};
