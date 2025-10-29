// frontend/src/components/EventForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

// NOTE: Replace this with your actual Netlify Function URL path
const API_BASE_URL = '/.netlify/functions/api'; 

const EventForm = ({ eventToEdit, onSave, onCancel }) => {
    const initialState = eventToEdit || {
        title: '',
        eventDate: '', // Should be ISO format (YYYY-MM-DDTHH:MM)
        staffMemberCount: 1,
        coInfluencer: '',
        locationName: '',
        locationCoordinates: { lat: 0, lng: 0 }
    };
    const [eventData, setEventData] = useState(initialState);
    const isEditing = !!eventToEdit;

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setEventData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const handleCoordChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({
            ...prev,
            locationCoordinates: {
                ...prev.locationCoordinates,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (isEditing) {
                // UPDATE / EDIT Operation
                await axios.put(`${API_BASE_URL}/events/${eventData.id}`, eventData);
                alert('Event updated successfully!');
            } else {
                // CREATE Operation (Matches the serverless function we built)
                await axios.post(`${API_BASE_URL}/events`, eventData);
                alert('Event created successfully and notifications triggered!');
            }
            onSave(); // Call parent function to close modal and refresh data
        } catch (error) {
            console.error('Error saving event:', error);
            alert(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    return (
        <div className="p-6 bg-white shadow-xl rounded-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">{isEditing ? 'Edit Event' : 'Add New Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields here (Title, Date, Staff, Influencer, Location, Coords) */}
                <input type="text" name="title" value={eventData.title} onChange={handleChange} placeholder="Event Title" required className="w-full p-2 border rounded" />
                <input type="datetime-local" name="eventDate" value={eventData.eventDate.slice(0, 16)} onChange={handleChange} required className="w-full p-2 border rounded" />
                <input type="number" name="staffMemberCount" value={eventData.staffMemberCount} onChange={handleChange} placeholder="Staff Count" required min="1" className="w-full p-2 border rounded" />
                <input type="text" name="coInfluencer" value={eventData.coInfluencer} onChange={handleChange} placeholder="Co-Influencer (Optional)" className="w-full p-2 border rounded" />
                <input type="text" name="locationName" value={eventData.locationName} onChange={handleChange} placeholder="Location Name" required className="w-full p-2 border rounded" />
                
                <div className="flex space-x-2">
                    <input type="number" name="lat" value={eventData.locationCoordinates.lat} onChange={handleCoordChange} placeholder="Latitude" step="any" className="w-1/2 p-2 border rounded" />
                    <input type="number" name="lng" value={eventData.locationCoordinates.lng} onChange={handleCoordChange} placeholder="Longitude" step="any" className="w-1/2 p-2 border rounded" />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-150">
                        {isEditing ? 'Update Event' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventForm;