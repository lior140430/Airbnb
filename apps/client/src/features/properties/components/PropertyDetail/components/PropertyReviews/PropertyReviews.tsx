import { Button } from '@/components/ui/Button/Button';
import { StarRating } from '@/components/ui/StarRating/StarRating';
import { TextField } from '@/components/ui/TextField/TextField';
import { useAuth } from '@/context/AuthContext';
import { Star } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addComment, type Property } from '../../../../property.service';

interface PropertyReviewsProps {
    property: Property;
    avgRating?: string | null;
    onRefresh: () => void;
}

export const PropertyReviews: React.FC<PropertyReviewsProps> = ({
    property,
    avgRating,
    onRefresh
}) => {
    const { isAuthenticated, openAuthDialog } = useAuth();
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddReview = async () => {
        if (!isAuthenticated) {
            openAuthDialog();
            return;
        }

        if (!newComment || newRating === 0) return;
        setSubmitting(true);
        try {
            await addComment(property._id, newComment, newRating);
            onRefresh();
            setNewComment('');
            setNewRating(0);
        } catch (error) {
            console.error('Failed to add review', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pd-reviews">
            <div className="pd-reviews-header">
                {avgRating !== null && avgRating !== undefined && <Star size={20} fill="currentColor" />}
                <span className="pd-reviews-title">
                    {avgRating ? `${avgRating} · ${property.commentsCount} ביקורות` : 'אין ביקורות עדיין'}
                </span>
                {property.commentsCount > 0 && (
                    <Link
                        to={`/property/${property._id}/reviews`}
                        className="pd-reviews-link"
                        style={{ marginRight: 'auto', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, textDecoration: 'underline' }}
                    >
                        ראה את כל הביקורות
                    </Link>
                )}
            </div>

            {property.comments && property.comments.length > 0 && (
                <div className="pd-review-grid">
                    {property.comments.map((comment) => (
                        <div key={comment._id} className="pd-review-card">
                            <div className="pd-review-top">
                                <div className="pd-reviewer-avatar">
                                    {comment.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="pd-reviewer-name">{comment.username}</div>
                                    <div className="pd-review-date">{comment.createdAt?.substring(0, 10)}</div>
                                </div>
                            </div>
                            <div className="pd-review-stars">
                                <StarRating value={comment.rating} readOnly size={14} />
                            </div>
                            <p className="pd-review-text">{comment.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Review Form */}
            <div className="pd-add-review">
                <h4 className="pd-section-title">הוספו ביקורת</h4>
                <div className="pd-add-review-rating">
                    <label>דירוג</label>
                    <StarRating value={newRating} onChange={setNewRating} />
                </div>
                <TextField
                    value={newComment}
                    onFocus={() => {
                        if (!isAuthenticated) {
                            openAuthDialog();
                        }
                    }}
                    onChange={(e: any) => setNewComment(e.target.value)}
                    placeholder="ספרו על החוויה שלכם..."
                    multiline
                    rows={3}
                />
                <div className="pd-add-review-actions">
                    <Button
                        onClick={handleAddReview}
                        disabled={submitting || (isAuthenticated && (!newComment || newRating === 0))}
                    >
                        {submitting ? 'שולח...' : 'שלח ביקורת'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
