import { Bookmark, CloudOff } from 'lucide-react';
import { useLanguage } from '../lib/language';
import { Button } from './ui/button';

export function SavedSyncNotice({ error, syncing, retry }: { error: string; syncing: boolean; retry: () => Promise<void> }) {
  const { t } = useLanguage();
  if (!error) return null;
  const storageFailed = error === 'storage_unavailable';
  const Icon = storageFailed ? Bookmark : CloudOff;
  return <div className={`saved-sync-notice${storageFailed ? ' saved-storage-error' : ''}`} role={storageFailed ? 'alert' : 'status'}>
    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
    <div>
      <strong>{storageFailed ? t('Bookmarks could not be saved', 'బుక్‌మార్క్‌లను భద్రపరచలేకపోయాం') : t('Saved on this device', 'ఈ పరికరంలో భద్రపరిచాం')}</strong>
      <p>{storageFailed ? t('Allow browser storage to keep them after refresh.', 'పేజీ తాజాకరించిన తరువాత కూడా ఉంచడానికి బ్రౌజర్ నిల్వను అనుమతించండి.') : t('Account sync is unavailable right now.', 'ప్రస్తుతం ఖాతాతో సమకాలీకరించడం అందుబాటులో లేదు.')}</p>
    </div>
    <Button variant="outline" disabled={syncing} onClick={() => void retry()}>{syncing ? t('Trying…', 'ప్రయత్నిస్తున్నాం…') : t('Retry', 'మళ్ళీ ప్రయత్నించండి')}</Button>
  </div>;
}
