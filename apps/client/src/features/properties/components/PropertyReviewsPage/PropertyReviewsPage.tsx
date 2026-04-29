import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { StarRating } from '@/components/ui/StarRating/StarRating';
import { TextField } from '@/components/ui/TextField/TextField';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { getAverageRating } from '@/utils/rating';
import { getImageUrl } from '@/utils/image';
import { ArrowRight, Star, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addComment, getComments, getProperty, deleteComment, type Comment, type Property } from '../../property.service';
import './PropertyReviewsPage.css';

export const PropertyReviewsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, openAuthDialog, user } = useAuth();

    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchProperty = useCallback(() => {
        if (!id) return Promise.reject('No ID');
        return getProperty(id);
    }, [id]);

    const fetchComments = useCallback(() => {
        if (!id) return Promise.reject('No ID');
        return getComments(id) as Promise<Comment[]>;
    }, [id]);

    const { data: property, loading: loadingProperty } = useAsync<Property>(fetchProperty);
    const { data: comments, loading: loadingComments, execute: refreshComments } = useAsync<Comment[]>(fetchComments);

    useEffect(() => {
        if (id) {
            fetchProperty();
            refreshComments();
        }
    }, [id, fetchProperty, refreshComments]);

    const handleAddReview = async () => {
        if (!isAuthenticated) {
            openAuthDialog();
            return;
        }
        if (!id || !newComment || newRating === 0) return;

        setSubmitting(true);
        try {
            await addComment(id, newComment, newRating);
            setNewComment('');
            setNewRating(0);
            refreshComments();
        } catch (error) {
            console.error('Failed to add review', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingProperty || loadingComments) {
        return <Spinner size={32} message="טוען ביקורות..." fullPage />;
    }

    if (!property) {
        return (
            <div className="prp-error">
                <h2>הנכס לא נמצא</h2>
                <button className="prp-back-btn" onClick={() => navigate('/')}>
                    <ArrowRight size={18} />
                    חזרה לדף הבית
                </button>
            </div>
        );
    }

    const avgRating = getAverageRating(comments || property.comments);
    const totalReviews = comments?.length ?? property.commentsCount ?? 0;
    const reviewList = comments || property.comments || [];
    const imageUrl = getImageUrl(property.images?.[0]);

    return (
        <div className="prp-container">
            <Link to={`/property/${id}`} className="prp-back-btn">
                <ArrowRight size={18} />
                חזרה לנכס
            </Link>

            <div className="prp-header">
                <img src={imageUrl} alt={property.title} className="prp-header-image" />
                <div className="prp-header-info">
                    <h1 className="prp-title">{property.title}</h1>
                    <div className="prp-rating-summary">
                        {avgRating ? (
                            <>
                                <Star size={22} fill="var(--brand-joy)" color="var(--brand-joy)" />
                                <span className="prp-avg-rating">{avgRating}</span>
                                <span className="prp-divider">·</span>
                                <span className="prp-total-reviews">{totalReviews} ביקורות</span>
                            </>
                        ) : (
                            <span className="prp-no-reviews">אין ביקורות עדיין</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="prp-reviews-list">
                <h2 className="prp-section-title">כל הביקורות</h2>
                {reviewList.length === 0 && (
                    <p className="prp-empty">עדיין אין ביקורות לנכס זה. היו הראשונים!</p>
                )}
                {reviewList.map((comment) => (
                    <div key={comment._id} className="prp-review-card">
                        <div className="prp-review-top">
                            <div className="prp-reviewer-avatar">
                                {comment.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="prp-reviewer-info">
                                <div className="prp-reviewer-name">{comment.username}</div>
                                <div className="prp-review-date">{comment.createdAt?.substring(0, 10)}</div>
                            </div>
                            {user && comment.userId === user._id && (
                                <button
                                    className="prp-delete-btn"
                                    title="מחק ביקורת"
                                    onClick={async () => {
                                        if (!window.confirm('למחוק את הביקורת?')) return;
                                        await deleteComment(comment._id);
                                        refreshComments();
                                    }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
                        </div>
                        <div className="prp-review-stars">
                            <StarRating value={comment.rating} readOnly size={14} />
                        </div>
                        <p className="prp-review-text">{comment.text}</p>
                    </div>
                ))}
            </div>

            {isAuthenticated && (
                <div className="prp-add-review">
                    <h3 className="prp-section-title">הוספת ביקורת</h3>
                    <div className="prp-add-review-rating">
                        <label>דירוג</label>
                        <StarRating value={newRating} onChange={setNewRating} />
                    </div>
                    <TextField
                        value={newComment}
                        onChange={(e: any) => setNewComment(e.target.value)}
                        placeholder="ספרו על החוויה שלכם..."
                        multiline
                        rows={3}
                    />
                    <div className="prp-add-review-actions">
                        <Button
                            onClick={handleAddReview}
                            disabled={submitting || !newComment || newRating === 0}
                        >
                            {submitting ? 'שולח...' : 'שלח ביקורת'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
