import { useState } from 'react';
import { useCreateEvent, useUpdateEvent } from '../hooks/useEvents';

const CATEGORIES = ['general','sports','music','food','art','tech','outdoors','social'];

const toLocalDatetimeInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const local  = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

export default function CreateEventForm({
  initialLat   = '',
  initialLng   = '',
  existingEvent = null,   // pass an event object to enter edit mode
  onSuccess    = () => {},
  onCancel     = () => {},
}) {
  const isEditing = !!existingEvent;

  const [form, setForm] = useState({
    title:        existingEvent?.title        || '',
    description:  existingEvent?.description  || '',
    lat:          existingEvent?.lat          || initialLat,
    lng:          existingEvent?.lng          || initialLng,
    address:      existingEvent?.address      || '',
    date_time:    existingEvent
      ? toLocalDatetimeInput(new Date(existingEvent.date_time))
      // eslint-disable-next-line react-hooks/purity
      : toLocalDatetimeInput(new Date(Date.now() + 3_600_000)),
    category:     existingEvent?.category     || 'general',
    max_attendees: existingEvent?.max_attendees || '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const mutation = isEditing ? updateMutation : createMutation;

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())         errs.title     = 'Title is required.';
    if (form.title.length > 200)    errs.title     = 'Title too long (max 200 chars).';
    if (!form.lat || !form.lng)     errs.lat       = 'Location coordinates are required.';
    if (!form.date_time)            errs.date_time = 'Date & time is required.';
    if (form.max_attendees && isNaN(Number(form.max_attendees)))
                                    errs.max_attendees = 'Must be a number.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    const payload = {
      ...form,
      lat:          parseFloat(form.lat),
      lng:          parseFloat(form.lng),
      max_attendees: form.max_attendees ? parseInt(form.max_attendees, 10) : null,
      date_time:    new Date(form.date_time).toISOString(),
    };

    try {
      const result = isEditing
        ? await mutation.mutateAsync({ id: existingEvent.id, ...payload })
        : await mutation.mutateAsync(payload);
      onSuccess(result);
    } catch (err) {
      // top-level server error – shown via mutation.error
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="label">Event Title *</label>
        <input
          className={`input ${fieldErrors.title ? 'border-ember focus:border-ember' : ''}`}
          placeholder="Give your event a name…"
          value={form.title}
          onChange={set('title')}
          maxLength={200}
        />
        {fieldErrors.title && <p className="text-xs text-ember mt-1">{fieldErrors.title}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="What's happening? Share details about your event…"
          value={form.description}
          onChange={set('description')}
        />
      </div>

      {/* Date & time */}
      <div>
        <label className="label">Date & Time *</label>
        <input
          type="datetime-local"
          className={`input ${fieldErrors.date_time ? 'border-ember' : ''}`}
          value={form.date_time}
          onChange={set('date_time')}
          min={toLocalDatetimeInput()}
        />
        {fieldErrors.date_time && <p className="text-xs text-ember mt-1">{fieldErrors.date_time}</p>}
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Latitude *</label>
          <input
            type="number"
            step="any"
            className={`input ${fieldErrors.lat ? 'border-ember' : ''}`}
            placeholder="40.7128"
            value={form.lat}
            onChange={set('lat')}
          />
        </div>
        <div>
          <label className="label">Longitude *</label>
          <input
            type="number"
            step="any"
            className="input"
            placeholder="-74.0060"
            value={form.lng}
            onChange={set('lng')}
          />
        </div>
      </div>
      {fieldErrors.lat && <p className="text-xs text-ember -mt-2">{fieldErrors.lat}</p>}
      <p className="text-xs text-night/40 -mt-2">
        💡 On the Map page you can click anywhere on the map to auto-fill these.
      </p>

      {/* Address */}
      <div>
        <label className="label">Address <span className="text-night/30 font-normal normal-case">(optional)</span></label>
        <input
          className="input"
          placeholder="123 Main St, City, State"
          value={form.address}
          onChange={set('address')}
        />
      </div>

      {/* Max attendees */}
      <div>
        <label className="label">Max Attendees <span className="text-night/30 font-normal normal-case">(optional – leave blank for unlimited)</span></label>
        <input
          type="number"
          min="1"
          className={`input ${fieldErrors.max_attendees ? 'border-ember' : ''}`}
          placeholder="e.g. 50"
          value={form.max_attendees}
          onChange={set('max_attendees')}
        />
        {fieldErrors.max_attendees && <p className="text-xs text-ember mt-1">{fieldErrors.max_attendees}</p>}
      </div>

      {/* Server error */}
      {mutation.isError && (
        <p className="text-sm text-ember bg-ember/8 rounded-lg px-3 py-2">
          {mutation.error?.message || 'Something went wrong. Please try again.'}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary flex-1 justify-center"
        >
          {mutation.isPending
            ? (isEditing ? 'Saving…' : 'Creating…')
            : (isEditing ? 'Save Changes' : 'Create Event')}
        </button>
      </div>
    </form>
  );
}