import { useLanguage } from '../lib/language';

/** Only displays the seller's saved declaration; missing information stays unknown. */
export function DietaryBadge({ isVeg }: { isVeg?: boolean }) {
  const { t } = useLanguage();
  const kind = isVeg === true ? 'veg' : isVeg === false ? 'nonveg' : 'unknown';
  return <span className="dietary-badge" data-diet={kind}>
    {kind !== 'unknown' && <span className="dietary-symbol" aria-hidden="true"><i /></span>}
    <span>{kind === 'veg' ? t('Veg', 'శాకాహారం') : kind === 'nonveg' ? t('Non-veg', 'మాంసాహారం') : t('Not specified', 'పేర్కొనలేదు')}</span>
  </span>;
}
