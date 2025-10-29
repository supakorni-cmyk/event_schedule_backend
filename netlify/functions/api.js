// netlify/functions/api.js

const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

const app = express();
// NOTE: We no longer need require('dotenv') or app.listen(PORT)

// Middleware
app.use(bodyParser.json());

// --- Simulated Database and Integration Functions (KEEP THESE) ---
// Note: In a real deployment, 'events' should be stored in a cloud database (PostgreSQL/MongoDB)
let events = [];

function sendEmailNotification(eventData, action) {
    console.log(`\n📧 [SERVERLESS LOG] Sending Email Notification: Event ${action}`);
    // ... (Integration code here)
}

function updateGoogleCalendar(eventData, action) {
    console.log(`\n🗓️ [SERVERLESS LOG] Updating Google Calendar: Event ${action}`);
    // ... (Integration code here)
}

// --- API Endpoints (Use the same code as server.js) ---

// **IMPORTANT**: All serverless routes must start with the function name path, 
// which, in this case, will be '/.netlify/functions/api'.

/**
 * Endpoint for Admin to CREATE a new event.
 */
const router = express.Router();

router.post('/events', (req, res) => {
    // ... (Your existing validation and logic from server.js goes here) ...
    const { 
        title, 
        description, 
        eventDate, 
        staffMemberCount, 
        coInfluencer, 
        locationName, 
        locationCoordinates 
    } = req.body;

    if (!title || !eventDate || !locationName) {
        return res.status(400).json({ message: 'Missing required event fields.' });
    }

    try {
        const newEvent = {
            id: events.length + 1,
            title,
            description: description || '',
            eventDate: new Date(eventDate),
            // ... rest of event data
        };

        events.push(newEvent);
        
        // Trigger Integrations
        updateGoogleCalendar(newEvent, 'CREATE');
        sendEmailNotification(newEvent, 'CREATED');

        return res.status(201).json({ 
            message: 'Event created successfully (Serverless Function).', 
            event: newEvent 
        });

    } catch (error) {
        return res.status(500).json({ message: 'Serverless function error.' });
    }
});

// Attach the router to the express app
app.use('/.netlify/functions/api', router);

// Export the handler for Netlify
module.exports.handler = serverless(app);

// NOTE: You can delete the original server.js file or keep it for local testing.