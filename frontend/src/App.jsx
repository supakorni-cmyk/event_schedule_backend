// frontend/src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import EventForm from './components/EventForm';

import 'react-big-calendar/lib/css/react-big-calendar.css'; 

const localizer = momentLocalizer(moment);
const API_BASE_URL = '/.netlify/functions/api';

function App() {
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Data Fetching
    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            // Note: If you use the separate router approach, ensure the backend has a GET /events route
            const response = await axios.get(`${API_BASE_URL}/events`);
            const formattedEvents = response.data.map(event => ({
                ...event,
                // Ensure date objects are correctly formatted for the Calendar component
                start: new Date(event.eventDate),
                end: new Date(moment(event.eventDate).add(1, 'hour')), // Example: 1 hour duration
                title: event.title,
                // Add Google Maps URL for display
                mapUrl: `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${event.locationCoordinates.lat},${event.locationCoordinates.lng}`
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            // Since the database is simulated in-memory, reload might fail if the function restarts.
            setEvents([]); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // 2. Calendar and Card Display Logic
    const EventCard = ({ event }) => (
        <div className="p-3 bg-white shadow-md rounded-lg mb-4 border-l-4 border-indigo-500">
            <h3 className="font-semibold text-lg text-indigo-700">{event.title}</h3>
            <p className="text-sm text-gray-600">📅 {moment(event.start).format('MMM D, h:mm A')}</p>
            <p className="text-sm text-gray-600">🧑‍🤝‍🧑 Staff: {event.staffMemberCount}</p>
            {event.coInfluencer && <p className="text-sm text-gray-600">✨ Influencer: {event.coInfluencer}</p>}
            <p className="text-sm text-gray-600">📍 Location: {event.locationName}</p>
            <div className="mt-2 h-40">
                {/* Embed Google Maps location using an iframe */}
                <iframe
                    title={`${event.title} Map`}
                    width="100%"
                    height="100%"
                    loading="lazy"
                    allowFullScreen
                    src={event.mapUrl}>
                </iframe> 
            </div>
            <div className="mt-3 flex space-x-2">
                <button 
                    onClick={() => { setEventToEdit(event); setShowForm(true); }}
                    className="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                <button 
                    onClick={() => handleDelete(event.id)}
                    className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
        </div>
    );

    // 3. Delete Operation
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event? This will also update Google Calendar and send an email.")) {
            return;
        }

        try {
            // Need a DELETE endpoint in serverless function
            await axios.delete(`${API_BASE_URL}/events/${id}`); 
            alert('Event deleted and integrations triggered!');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert(`Error deleting event: ${error.message}`);
        }
    };

    // 4. Calendar View (Agenda view will be helpful for the list)
    const { views } = useMemo(() => ({
        views: ['month', 'week', 'day', 'agenda'],
    }), []);
    
    // Custom logic to show the card view when a date is selected (in a real app, this is complex)
    // For simplicity, we'll just use the Agenda view to show a list of events.

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">🗓️ Admin Event Dashboard</h1>
                <button 
                    onClick={() => { setEventToEdit(null); setShowForm(true); }}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition">
                    + Add New Event
                </button>
            </header>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <EventForm 
                        eventToEdit={eventToEdit}
                        onSave={() => { setShowForm(false); setEventToEdit(null); fetchEvents(); }}
                        onCancel={() => { setShowForm(false); setEventToEdit(null); }}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Monthly Calendar View (Column 1 & 2) */}
                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-xl">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        views={views}
                    /> 
                </div>

                {/* Event Cards/Details (Column 3) */}
                <div className="md:col-span-1 space-y-4 max-h-[700px] overflow-y-auto">
                    <h2 className="text-xl font-semibold text-gray-800 sticky top-0 bg-gray-50 p-2 border-b">Upcoming Events (Agenda)</h2>
                    {isLoading ? (
                        <p className="text-center text-gray-500">Loading events...</p>
                    ) : events.length > 0 ? (
                        events.sort((a, b) => a.start - b.start).map(event => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : (
                        <p className="text-center text-gray-500">No events scheduled.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;