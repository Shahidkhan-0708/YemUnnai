import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState } from 'react';
import { X, ThumbsUp, Star } from 'lucide-react';
import { submitReview } from '../lib/api';
import { useModalA11y } from '../lib/useModalA11y';
import type { FoodItem } from '../lib/types';
import { toast } from './ui/sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}


export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmitSuccess
}) => {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sheetRef = useModalA11y<HTMLDivElement>(isOpen && !!item, onClose);

  if (!isOpen || !item) return null;

  const activeCount = hovered ?? rating;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const ok = await submitReview({
      foodItemId: item.id,
      rating,
      isLiked,
      comment
    });

    setSubmitting(false);

    if (!ok) {
      setSubmitError('Could not submit review. Please try again.');
      toast.error('Could not submit review. Please try again.');
      return;
    }
    setSubmitted(true);
    toast.success('Review published! Thank you for the feedback.');
    setTimeout(() => {
      setSubmitted(false);
      setRating(5);
      setComment('');
      onSubmitSuccess?.();
      onClose();
    }, 1100);
  };

  return <SvgScreenFrame screen={'feedback'}><div className="pickup-overlay" onClick={()=>{if(!submitting)onClose();}}><div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="pickup-sheet feedback-sheet" onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/><button type="button" className="sheet-close" aria-label="Close" onClick={onClose} disabled={submitting}><X size={15}/></button>
    {submitted ? <div role="status" className="py-12 text-center"><ThumbsUp className="mx-auto text-[#F06A05]"/><h2 className="sheet-title mt-4">Review published</h2><p className="sheet-subtitle">Thanks for sharing your feedback.</p></div> : <>
      <h2 id="feedback-title" className="sheet-title">Leave a review</h2><p className="sheet-subtitle">{item.vendor}</p>
      <div className="feedback-rating"><p>Rating</p><div>{[1,2,3,4,5].map(value=><button key={value} type="button" aria-label={`Rate ${value} star${value>1?'s':''}`} aria-pressed={rating===value} onMouseEnter={()=>setHovered(value)} onMouseLeave={()=>setHovered(null)} onClick={()=>setRating(value)}><Star size={24} strokeWidth={1.5} fill={value<=activeCount?'#EAA02B':'none'} color="#EAA02B"/></button>)}</div></div>
      <div className="feedback-recommend"><p>Would you recommend it?</p><div><button type="button" aria-pressed={isLiked} onClick={()=>setIsLiked(true)}>Liked it</button><button type="button" aria-pressed={!isLiked} onClick={()=>setIsLiked(false)}>Could be better</button></div></div>
      <label className="feedback-comment">Comment<textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={2000} placeholder="How was the food?"/></label>
      {submitError&&<p className="pickup-error" role="alert">{submitError}</p>}
      <button type="button" className="feedback-submit" onClick={()=>void handleSubmit()} disabled={submitting}>{submitting?'Submitting…':'Submit review'}</button>
    </>}
  </div></div></SvgScreenFrame>;
};
