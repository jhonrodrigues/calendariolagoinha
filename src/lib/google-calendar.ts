import prisma from "@/lib/prisma";

export async function syncEventToGoogle(eventId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account || !account.access_token) return;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) return;

  // Format date for Google Calendar (RFC3339)
  const startTime = new Date(event.date);
  if (event.startTime) {
    const [hours, minutes] = event.startTime.split(":");
    startTime.setHours(parseInt(hours), parseInt(minutes), 0);
  } else {
    startTime.setHours(9, 0, 0); // Default to 9 AM
  }

  const endTime = new Date(startTime);
  if (event.endTime) {
    const [hours, minutes] = event.endTime.split(":");
    endTime.setHours(parseInt(hours), parseInt(minutes), 0);
  } else {
    endTime.setHours(startTime.getHours() + 1); // Default to 1 hour duration
  }

  const googleEvent = {
    summary: event.title,
    description: event.description || "",
    location: event.location || "",
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "UTC",
    },
  };

  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error syncing to Google Calendar:", error);
    }
  } catch (error) {
    console.error("Failed to sync to Google Calendar:", error);
  }
}
