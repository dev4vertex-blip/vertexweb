import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { Booking } from '../../types';

interface ReviewItem {
  id: string;
  bookingId: string;
  serviceName: string;
  technicianName: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    bookingId: 'VTX-84920',
    serviceName: 'AC Repair',
    technicianName: 'Raj Technician',
    rating: 5,
    tags: ['Super Punctual', 'Expert Diagnosis', 'Clean Work'],
    comment: 'Raj identified the copper coil leak immediately and resolved the dripping issue. Very professional and polite!',
    createdAt: '2 days ago',
  },
  {
    id: 'rev-2',
    bookingId: 'VTX-84880',
    serviceName: 'Electrician',
    technicianName: 'Vikram Singh',
    rating: 5,
    tags: ['Polite Behaviour', 'Fair Pricing'],
    comment: 'Replaced MCB and checked all ground earthing points safely. 10/10 recommended service.',
    createdAt: '2 weeks ago',
  },
];

const COMPLIMENT_TAGS = [
  'Super Punctual',
  'Expert Diagnosis',
  'Clean Work',
  'Polite Behaviour',
  'Genuine Spares',
  'Great Value',
];

interface CustomerReviewsProps {
  onBack?: () => void;
  preselectedBooking?: Booking | null;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  onBack,
  preselectedBooking,
}) => {
  const { bookings, currentCustomer, addToast } = useApp();
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_REVIEWS);

  // Completed bookings that can be reviewed
  const completedBookings = bookings.filter(
    (b) =>
      b.status === 'completed' &&
      (!b.customerId || b.customerId === currentCustomer.id)
  );

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    preselectedBooking?.id || completedBookings[0]?.id || ''
  );
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Expert Diagnosis', 'Clean Work']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(!!preselectedBooking);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBooking = bookings.find((b) => b.id === selectedBookingId);
    if (!targetBooking) {
      addToast('Error', 'Please select a valid completed booking.', 'error');
      return;
    }

    setIsSubmitting(true);

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      bookingId: targetBooking.id,
      serviceName: targetBooking.serviceName,
      technicianName: targetBooking.technicianName || 'Certified Engineer',
      rating,
      tags: selectedTags,
      comment: comment.trim() || 'Great service and quick resolution.',
      createdAt: 'Just now',
    };

    setTimeout(() => {
      setReviewsList([newReview, ...reviewsList]);
      setIsSubmitting(false);
      setShowReviewForm(false);
      setComment('');
      addToast('Review Submitted', 'Thank you! Your feedback helps maintain our 5-star service standards.', 'success');
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reviews & Ratings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rate your certified technicians and view past service feedback
            </p>
          </div>
        </div>

        {completedBookings.length > 0 && !showReviewForm && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowReviewForm(true)}
            leftIcon={<Star className="w-3.5 h-3.5" />}
          >
            Rate a Service
          </Button>
        )}
      </div>

      {/* Review Submission Form */}
      {showReviewForm && (
        <Card className="p-6 border-blue-200 bg-gradient-to-b from-blue-50/40 to-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Share Your Feedback</span>
            </h2>
            <button
              onClick={() => setShowReviewForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer p-1"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Booking Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Completed Service
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                {completedBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} - {b.serviceName} ({b.scheduledDate}) • {b.technicianName || 'Technician'}
                  </option>
                ))}
              </select>
            </div>

            {/* 1-5 Star Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= rating
                          ? 'text-amber-500 fill-amber-500 scale-110'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5
                    ? 'Excellent (5.0)'
                    : rating === 4
                    ? 'Very Good (4.0)'
                    : rating === 3
                    ? 'Average (3.0)'
                    : 'Needs Improvement'}
                </span>
              </div>
            </div>

            {/* Compliment Badges */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What went well?
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPLIMENT_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Comments
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the diagnostic speed, spare parts, or doorstep conduct..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full justify-center py-2.5"
            >
              {isSubmitting ? 'Posting Review...' : 'Submit Verified Feedback'}
            </Button>
          </form>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Your Past Reviews ({reviewsList.length})
        </h3>

        {reviewsList.map((rev) => (
          <Card key={rev.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{rev.serviceName}</span>
                  <Badge variant="accent" size="sm">
                    {rev.bookingId}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Technician: {rev.technicianName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {rev.createdAt}
                  </span>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-900">{rev.rating}.0</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 mt-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{rev.comment}"
            </p>

            {rev.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {rev.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
