import api from './client';

/**
 * Fetch all events, optionally filtered.
 * @param {object} params – lat, lng, radius, category, from, to, limit, offset
 */
export const fetchEvents = async (params = {}) => {
  const { data } = await api.get('/events', { params });
  return data.events;
};

/** Fetch a single event with attendee list */
export const fetchEvent = async (id) => {
  const { data } = await api.get(`/events/${id}`);
  return data; // { event, attendees }
};

/** Create a new event */
export const createEvent = async (payload) => {
  const { data } = await api.post('/events', payload);
  return data.event;
};

/** Update an existing event */
export const updateEvent = async ({ id, ...payload }) => {
  const { data } = await api.put(`/events/${id}`, payload);
  return data.event;
};

/** Delete an event */
export const deleteEvent = async (id) => {
  const { data } = await api.delete(`/events/${id}`);
  return data;
};

/** RSVP to an event */
export const rsvpEvent = async ({ eventId, status = 'going' }) => {
  const { data } = await api.post(`/events/${eventId}/rsvp`, { status });
  return data.rsvp;
};

/** Cancel an RSVP */
export const cancelRsvp = async (eventId) => {
  const { data } = await api.delete(`/events/${eventId}/rsvp`);
  return data;
};

/** Get the current user's RSVP for an event */
export const getMyRsvp = async (eventId) => {
  const { data } = await api.get(`/events/${eventId}/rsvp`);
  return data.rsvp;
};