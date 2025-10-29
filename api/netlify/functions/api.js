// api/netlify/functions/api.js

const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
// NOTE: googleapis and related logic removed entirely

const app = express();
app.use(bodyParser.json());

// --- Simulated Database (In-Memory Array) ---
// IMPORTANT: Replace this with a real cloud database for production.
let events = []; 
let nextId = 1; 

// --- SendGrid Initialization ---
// This initializes the client using the environment variable set in Netlify
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define the sender and recipient emails
const SENDER_EMAIL = 'verified-sender@yourdomain.com'; // REPLACE with your verified SendGrid Sender
const ADMIN_EMAIL = 'admin@yourcompany.com';           // REPLACE with the recipient email

// --- Integration Functions ---

// Placeholder for the actual Email Notification system (Next Step)
async function sendEmailNotification(eventData, action) {
    if (!process.env.SENDGRID_API_KEY) {
        console.error("🚨 SENDGRID API KEY IS MISSING. Email not sent.");
        return;
    }

    const { 
        id, title, eventDate, staffMemberCount, locationName 
    } = eventData;
    
    const formattedDate = new Date(eventDate).toLocaleString();

    let subject;
    let text;

    if (action === 'CREATED') {
        subject = `✅ NEW EVENT CREATED: ${title}`;
        text = `A new event has been scheduled:\n\nTitle: ${title}\nDate: ${formattedDate}\nLocation: ${locationName}\nStaff Count: ${staffMemberCount}\n\nCheck the dashboard for details.`;
    } else if (action === 'UPDATED') {
        subject = `⚠️ EVENT UPDATED: ${title}`;
        text = `Event #${id} (${title}) has been updated. Please review the changes:\n\nNew Date: ${formattedDate}\nNew Location: ${locationName}\n\nCheck the dashboard for details.`;
    } else if (action === 'DELETED') {
        subject = `❌ EVENT DELETED: ${title}`;
        text = `Event #${id} (${title}) was permanently deleted from the schedule.`;
    } else {
        return; // Unknown action
    }

    const msg = {
        to: ADMIN_EMAIL,
        from: SENDER_EMAIL,
        subject: subject,
        text: text,
        // You can use html for richer formatting here:
        // html: `<strong>${text.replace(/\n/g, '<br>')}</strong>`,
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 SendGrid: Email sent successfully for action ${action}.`);
    } catch (error) {
        console.error("🚨 SENDGRID ERROR:", error.response.body);
        // Important: Log the error but don't stop the API response
    }
}


// 3. UPDATE (PUT)
router.put('/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    const updatedData = req.body;
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    
    const existingEvent = events[eventIndex];
    const updatedEvent = {
        ...existingEvent,
        ...updatedData,
        eventDate: updatedData.eventDate ? new Date(updatedData.eventDate).toISOString() : existingEvent.eventDate,
        updatedAt: new Date().toISOString()
    };
    
    events[eventIndex] = updatedEvent;

    // Trigger Email Integration
    sendEmailNotification(updatedEvent, 'UPDATED');

    return res.status(200).json({ 
        message: 'Event updated successfully and notification triggered.', 
        event: updatedEvent 
    });
});


// 4. DELETE (DELETE)
router.delete('/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
        return res.status(404).json({ message: 'Event not found.' });
    }

    const [deletedEvent] = events.splice(eventIndex, 1);

    // Trigger Email Integration
    sendEmailNotification(deletedEvent, 'DELETED');

    return res.status(200).json({ 
        message: 'Event deleted successfully and notification triggered.', 
        deletedEvent 
    });
});


// Attach the router to the express app at the Netlify function path
app.use('/.netlify/functions/api', router);

// Export the handler for Netlify
module.exports.handler = serverless(app);