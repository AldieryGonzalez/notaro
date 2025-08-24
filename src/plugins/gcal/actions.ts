"use server";

import { tool } from "ai";
import { calendarClient } from ".";
import { calendar_v3 } from "googleapis";
import z from "zod";

export async function listEvents(
  calendarId: string = "primary",
  maxResults: number = 10,
  timeMin?: string,
  timeMax?: string
) {
  try {
    const response = await calendarClient.events.list({
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: timeMin || new Date().toISOString(),
      timeMax,
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Failed to list events:", error);
    throw error;
  }
}

export async function createEvent(
  title: string,
  description?: string,
  startDateTime?: string,
  endDateTime?: string,
  calendarId: string = "primary",
  attendees?: string[]
) {
  try {
    const start =
      startDateTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    const end =
      endDateTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now

    const event: calendar_v3.Schema$Event = {
      summary: title,
      description,
      start: {
        dateTime: start,
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: end,
        timeZone: "America/Los_Angeles",
      },
      attendees: attendees?.map((email) => ({ email })),
    };

    const response = await calendarClient.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "all",
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create event:", error);
    throw error;
  }
}

export async function updateEvent(
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    attendees?: string[];
  },
  calendarId: string = "primary"
) {
  try {
    const event: calendar_v3.Schema$Event = {};

    if (updates.title) event.summary = updates.title;
    if (updates.description) event.description = updates.description;
    if (updates.startDateTime) {
      event.start = {
        dateTime: updates.startDateTime,
        timeZone: "America/Los_Angeles",
      };
    }
    if (updates.endDateTime) {
      event.end = {
        dateTime: updates.endDateTime,
        timeZone: "America/Los_Angeles",
      };
    }
    if (updates.attendees) {
      event.attendees = updates.attendees.map((email) => ({ email }));
    }

    const response = await calendarClient.events.patch({
      calendarId,
      eventId,
      requestBody: event,
      sendUpdates: "all",
    });

    return response.data;
  } catch (error) {
    console.error("Failed to update event:", error);
    throw error;
  }
}

export async function deleteEvent(
  eventId: string,
  calendarId: string = "primary"
) {
  try {
    await calendarClient.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });

    return { success: true, message: `Event ${eventId} deleted successfully` };
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw error;
  }
}

export async function getEvent(
  eventId: string,
  calendarId: string = "primary"
) {
  try {
    const response = await calendarClient.events.get({
      calendarId,
      eventId,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to get event:", error);
    throw error;
  }
}

export async function listCalendars() {
  try {
    const response = await calendarClient.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error("Failed to list calendars:", error);
    throw error;
  }
}

export async function findAvailableTimeSlots(
  duration: number = 60, // duration in minutes
  startDate?: string,
  endDate?: string,
  calendarId: string = "primary"
) {
  try {
    const timeMin = startDate || new Date().toISOString();
    const timeMax =
      endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    const response = await calendarClient.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      },
    });

    const busyTimes = response.data.calendars?.[calendarId]?.busy || [];

    // Simple algorithm to find free slots
    const freeSlots = [];
    const start = new Date(timeMin);
    const end = new Date(timeMax);

    // Check for free slots between busy periods
    let currentTime = new Date(start);

    for (const busyPeriod of busyTimes) {
      const busyStart = new Date(busyPeriod.start!);
      const busyEnd = new Date(busyPeriod.end!);

      // If there's a gap before this busy period
      if (currentTime < busyStart) {
        const slotEnd = new Date(
          Math.min(
            busyStart.getTime(),
            currentTime.getTime() + duration * 60 * 1000
          )
        );
        if (slotEnd > currentTime) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
          });
        }
      }

      currentTime = new Date(
        Math.max(currentTime.getTime(), busyEnd.getTime())
      );
    }

    // Check for free slot after the last busy period
    if (currentTime < end) {
      const slotEnd = new Date(
        Math.min(end.getTime(), currentTime.getTime() + duration * 60 * 1000)
      );
      if (slotEnd > currentTime) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }

    return freeSlots;
  } catch (error) {
    console.error("Failed to find available time slots:", error);
    throw error;
  }
}
