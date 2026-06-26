import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEvents, fetchEvent,
  createEvent, updateEvent, deleteEvent,
  rsvpEvent, cancelRsvp, getMyRsvp,
} from '../api/events';

// ─── Query key factory ──────────────────────────────────────────────────────
export const eventKeys = {
  all:     () => ['events'],
  list:    (filters) => [...eventKeys.all(), 'list', filters],
  detail:  (id)      => [...eventKeys.all(), 'detail', id],
  myRsvp:  (id)      => [...eventKeys.all(), 'rsvp', id],
};

// ─── Read ────────────────────────────────────────────────────────────────────

/** Fetch the events list with optional filters (lat, lng, radius, category…) */
export function useEvents(filters = {}) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn:  () => fetchEvents(filters),
  });
}

/** Fetch one event + attendees */
export function useEvent(id) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn:  () => fetchEvent(id),
    enabled:  !!id,
  });
}

/** Current user's RSVP for one event */
export function useMyRsvp(eventId) {
  return useQuery({
    queryKey: eventKeys.myRsvp(eventId),
    queryFn:  () => getMyRsvp(eventId),
    enabled:  !!eventId,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all() }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(id) });
      qc.invalidateQueries({ queryKey: eventKeys.all() });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all() }),
  });
}

export function useRsvpEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rsvpEvent,
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.myRsvp(eventId) });
    },
  });
}

export function useCancelRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelRsvp,
    onSuccess: (_data, eventId) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.myRsvp(eventId) });
    },
  });
}