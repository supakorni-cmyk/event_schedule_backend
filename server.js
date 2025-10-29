const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // For environment variables like API keys

const app = express();
const PORT = process.defaultMaxListeners || 3000;

// Middleware
app.use(bodyParser.json());

// --- Simulated Database (Replace with PostgreSQL/MongoDB later) ---
let events = []; // Stores event objects with a unique ID

// --- Integration Functions (These will be actual API calls later) ---

/**
 * Simulates sending an email notification to the distribution list.
 * In a real application, this would use SendGrid/Mailgun/etc.
 * @param {object} eventData - The data of the created/updated event.
 * @param {string} action - 'CREATED', 'UPDATED', or 'DELETED'.
 */
function sendEmailNotification(eventData, action) {
    console.log(`\n📧 Sending Email Notification: Event ${action}`);
    console.log(`Title: ${eventData.title}`);
    console.log(`Action details: Event was ${action} successfully.`);
    // A real implementation would use an external library like nodemailer,
    // connected to a service like SendGrid, using process.env.SENDGRID_API_KEY
}

/**
 * Simulates updating the event in Google Calendar.
 * In a real application, this requires the Google Calendar API.
 * @param {object} eventData - The data of the created/updated event.
 * @param {string} action - 'CREATE', 'UPDATE', or 'DELETE'.
 */
function updateGoogleCalendar(eventData, action) {
    console.log(`\n🗓️ Updating Google Calendar: Event ${action}`);
    console.log(`Event: ${eventData.title} at ${eventData.eventDate}`);
    // A real implementation would use the 'googleapis' library
    // and store the returned 'googleCalendarId' in the database.
}

// --- API Endpoints ---

/**
 * Endpoint for Admin to CREATE a new event.
 * POST /api/events
 */
app.post('/api/events', async (req, res) => {
    const { 
        title, 
        description, 
        eventDate, 
        staffMemberCount, 
        coInfluencer, 
        locationName, 
        locationCoordinates 
    } = req.body;

    // 1. Basic Validation (In a real app, this would be more robust)
    if (!title || !eventDate || !locationName) {
        return res.status(400).json({ message: 'Missing required event fields.' });
    }

    try {
        // 2. Create the Event Object
        const newEvent = {
            id: events.length + 1, // Simple auto-increment ID
            title,
            description: description || '',
            eventDate: new Date(eventDate),
            staffMemberCount: staffMemberCount || 0,
            coInfluencer: coInfluencer || 'None',
            locationName,
            locationCoordinates: locationCoordinates || { lat: 0, lng: 0 },
            createdAt: new Date(),
            // googleCalendarId: null // To be populated after integration
        };

        // 3. Save to "Database"
        events.push(newEvent);
        
        // 4. Integrations - The critical part!
        // These calls are typically non-blocking (async) to prevent API timeouts.
        updateGoogleCalendar(newEvent, 'CREATE');
        sendEmailNotification(newEvent, 'CREATED');

        // 5. Respond to the Admin
        return res.status(201).json({ 
            message: 'Event created successfully and integrations triggered.', 
            event: newEvent 
        });

    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ message: 'Internal server error during event creation.' });
    }
});

/**
 * Simple GET endpoint to view all events (for testing)
 * GET /api/events
 */
app.get('/api/events', (req, res) => {
    return res.status(200).json(events);
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`\n✅ Server is running on http://localhost:${PORT}`);
    console.log('Use a tool like Postman to POST data to: http://localhost:3000/api/events');
});