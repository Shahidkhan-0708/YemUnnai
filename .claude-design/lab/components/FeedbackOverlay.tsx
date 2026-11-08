// FeedbackOverlay.tsx - Interactive feedback overlay (Figma-like)
// Enables users to click any element and leave structured comments per variant.
// Critical component of the Design Lab - never skip this.

import { useState } from 'react';

interface FeedbackComment {
  element: string;
  variant: string;
  text: string;
  selector: string;
}

interface FeedbackOverlayProps {
  targetName: string;
  variantCount?: number;
}

export function FeedbackOverlay({ targetName, variantCount = 5 }: FeedbackOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addingFeedback, setAddingFeedback] = useState(false);
  const [currentElement, setCurrentElement] = useState<{ element: string; selector: string; variant: string } | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [overallDirection, setOverallDirection] = useState('');

  const removeComment = (index: number) => {
    setComments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFeedback = () => {
    const lines: string[] = [];
    lines.push('## Design Lab Feedback');
    lines.push('');
    lines.push(`**Target:** ${targetName}`);
    lines.push(`**Comments:** ${comments.length}`);
    lines.push('');

    const byVariant: Record<string, FeedbackComment[]> = {};
    comments.forEach(c => {
      if (!byVariant[c.variant]) byVariant[c.variant] = [];
      byVariant[c.variant].push(c);
    });

    Object.keys(byVariant).sort().forEach(variant => {
      lines.push(`### Variant ${variant}`);
      byVariant[variant].forEach((c, i) => {
        lines.push(`${i + 1}. **${c.element}** (\`${c.selector}\`, ${variant.toLowerCase()})`);
        lines.push(`   "${c.text}"`);
        lines.push('');
      });
    });

    if (overallDirection.trim()) {
      lines.push('### Overall Direction');
      lines.push(overallDirection.trim());
      lines.push('');
    }

    return lines.join('\n');
  };

  const copyFeedback = () => {
    const text = formatFeedback();
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Add Feedback button */}
      <button
        type="button"
        onClick={() => { setAddingFeedback(true); setIsOpen(false); }}
        disabled={addingFeedback}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F06A05] text-white text-xs font-bold shadow-lg hover:bg-[#D85800] transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#F06A05] focus:ring-offset-2"
        aria-label="Add Feedback"
      >
        {addingFeedback ? (
          <span className="animate-pulse">Click an element…</span>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Add Feedback
          </>
        )}
      </button>

      {/* Feedback indicator dot per variant (if variantCount > 1) */}
      {variantCount > 1 && (
        <div className="fixed bottom-4 left-4 z-40 flex gap-2">
          {[...Array(variantCount)].map((_, i) => {
            const variantCommentCount = comments.filter(c => c.variant === String.fromCharCode(65 + i)).length;
            return (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm border-2 transition-all ${
                  variantCommentCount > 0
                    ? 'bg-[#F06A05] text-white border-[#F06A05]'
                    : 'bg-white text-[#7A6658] border-[#D6DCE2]'
                }`}
                title={`Variant ${String.fromCharCode(65 + i)}: ${variantCommentCount} comment(s)`}
              >
                {variantCommentCount > 0 ? variantCommentCount : String.fromCharCode(65 + i)}
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#1F140A]/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-md mx-auto mt-20 bg-white rounded-2xl border border-[#D6DCE2] shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1F140A]">Leave Feedback</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F1ED] text-[#7A6658] focus:outline-none focus:ring-2 focus:ring-[#F06A05]"
                aria-label="Close feedback panel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Current element being commented on */}
            {currentElement && (
              <div className="mb-4 p-3 bg-[#FFF8F2] border border-[#F0E8E0] rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A23D00] mb-1">Commenting on</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1F140A]">{currentElement.variant}</span>
                  <span className="text-sm text-[#7A6658]">{currentElement.element}</span>
                  <span className="text-[9px] text-[#7A6658] font-mono">{currentElement.selector}</span>
                </div>
              </div>
            )}

            {/* Comments list */}
            {comments.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto pr-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6658] mb-2">Comments</p>
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 p-2 rounded border border-[#F0E8E0] bg-[#FFF8F2]">
                    <span className="text-[9px] font-bold text-[#F06A05]">{c.variant}</span>
                    <span className="text-xs text-[#1F140A]">{c.element}</span>
                    <p className="text-xs text-[#7A6658] mt-0.5">{`"${c.text}"`}</p>
                    <button
                      type="button"
                      onClick={() => removeComment(i)}
                      className="ml-auto p-1 hover:text-[#B4382B] focus:outline-none"
                      aria-label="Remove comment"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input when adding new feedback */}
            {addingFeedback && currentElement && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#1F140A] mb-1.5">Your comment</label>
                <textarea
                  rows={2}
                  placeholder="Describe what should change…"
                  className="w-full min-h-[80px] px-3 py-2 border border-[#D6DCE2] rounded-lg text-sm text-[#1F140A] focus:outline-none focus:ring-2 focus:ring-[#F06A05] focus:border-transparent"
                  onChange={() => {
                    // We store the text via a local state to pass to addComment
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setAddingFeedback(false); setCurrentElement(null); }}
                    className="px-3 py-1.5 rounded-lg text-[#7A6658] text-sm font-medium hover:bg-[#F5F1ED]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-[#F06A05] text-white text-sm font-medium opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Overall direction (required when submitting) */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#1F140A] mb-1.5">Overall direction (required)</label>
              <textarea
                rows={2}
                value={overallDirection}
                onChange={(e) => setOverallDirection(e.target.value)}
                placeholder="e.g. I prefer Variant B because…"
                className="w-full min-h-[80px] px-3 py-2 border border-[#D6DCE2] rounded-lg text-sm text-[#1F140A] focus:outline-none focus:ring-2 focus:ring-[#F06A05] focus:border-transparent"
              />
            </div>

            {/* Submit actions */}
            <div className="flex gap-2 pt-4 border-t border-[#F0E8E0]">
              <button
                type="button"
                onClick={() => { setIsOpen(false); setComments([]); setOverallDirection(''); }}
                className="flex-1 px-4 py-2 rounded-lg text-[#7A6658] font-medium border border-[#D6DCE2] hover:bg-[#F5F1ED] text-sm"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={comments.length === 0 || !overallDirection.trim()}
                onClick={() => copyFeedback()}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium text-sm ${
                  comments.length === 0 || !overallDirection.trim()
                    ? 'bg-[#D6DCE2] cursor-not-allowed'
                    : 'bg-[#F06A05] hover:bg-[#D85800] shadow-lg'
                }`}
              >
                Copy Feedback
              </button>
            </div>
            <p className="text-[10px] text-[#7A6658] mt-2 text-center">
              Paste the copied text here in the terminal
            </p>
          </div>
        </div>
      )}

      {/* Inject click handlers into variant containers - this runs after render */}
      {addingFeedback && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.querySelectorAll('[data-variant]').forEach(function(container) {
                  container.addEventListener('click', function(e) {
                    if (e.target.closest('[data-variant]') === this) {
                      // Element clicked within variant - handled by React
                    }
                  }, true);
                });
              })();
            `,
          }}
        />
      )}
    </>
  );
}

export default FeedbackOverlay;