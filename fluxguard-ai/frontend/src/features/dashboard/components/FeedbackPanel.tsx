import { useState } from 'react';

import { Button, Panel } from '@/components/ui';
import { api } from '@/services/api';

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';

const ZONE_UUID_MAP: Record<string, string> = {
  'north-gate': '00000000-0000-0000-0000-000000000001',
  'east-concourse': '00000000-0000-0000-0000-000000000002',
  'gate-c': '00000000-0000-0000-0000-000000000003',
  'west-entrance': '00000000-0000-0000-0000-000000000004',
};

const ZONES = [
  { id: 'north-gate', name: 'North Gate' },
  { id: 'east-concourse', name: 'East Concourse' },
  { id: 'gate-c', name: 'Gate C' },
  { id: 'west-entrance', name: 'West Entrance' },
];

export function FeedbackPanel() {
  const [zoneId, setZoneId] = useState('north-gate');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('Comment is required.');
      return;
    }
    if (comment.length > 500) {
      setErrorMessage('Comment cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const zoneUuid = ZONE_UUID_MAP[zoneId];
      // When executing offline, this hits fetch mocks or endpoints with mock tokens
      await api.submitFeedback(EVENT_ID, zoneUuid, rating, comment);
      setSubmitted(true);
      setComment('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit feedback. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Panel
        eyebrow="Manual feedback capture"
        title="Feedback Submitted"
        aria-label="Feedback success state"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary bg-brand-primary/10 text-brand-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">Thank you for your feedback!</h3>
            <p className="text-xs text-ink-muted">
              Your feedback is ingested into our Dynamic Intelligence Layer to optimize crowd
              routing policies.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
            Submit Another
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      eyebrow="Manual feedback capture"
      title="Submit Stadium Feedback"
      aria-label="Feedback submission form"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage ? (
          <div className="rounded-command border border-risk-critical/30 bg-risk-critical/10 p-3 text-xs text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-1">
          <label
            htmlFor="feedback-zone"
            className="block text-xs font-semibold uppercase text-ink-muted"
          >
            Stadium Zone
          </label>
          <select
            id="feedback-zone"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full rounded-command border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            aria-required="true"
          >
            {ZONES.map((zone) => (
              <option key={zone.id} value={zone.id} className="bg-slate-900 text-ink">
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span id="rating-label" className="block text-xs font-semibold uppercase text-ink-muted">
            Zone Rating
          </span>
          <div
            role="radiogroup"
            aria-labelledby="rating-label"
            className="flex items-center gap-1 py-1"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => setRating(star)}
                className="group p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary rounded"
              >
                <svg
                  className={`h-6 w-6 transition-colors ${
                    rating >= star ? 'text-amber-400 fill-amber-400' : 'text-white/20'
                  } group-hover:text-amber-300`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36.12 1.36.755 0 .34-.204.68-.485.833l-3.97 2.88a1 1 0 00-.364 1.118l1.52 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.88a1 1 0 00-1.18 0l-3.97 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.88c-.282-.153-.487-.493-.487-.833 0-.635.399-.755 1.36-.755h4.907a1 1 0 00.95-.69l1.52-4.674z"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="feedback-comment"
              className="block text-xs font-semibold uppercase text-ink-muted"
            >
              Comment
            </label>
            <span
              className={`text-2xs ${
                comment.length > 450 ? 'text-risk-critical' : 'text-ink-subdued'
              }`}
              aria-live="polite"
            >
              {comment.length}/500
            </span>
          </div>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Describe gate flow, queue conditions, or safety observations..."
            className="w-full rounded-command border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder-ink-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
            aria-required="true"
            aria-invalid={errorMessage ? 'true' : 'false'}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
          aria-label="Submit feedback form"
        >
          Submit Feedback
        </Button>
      </form>
    </Panel>
  );
}
