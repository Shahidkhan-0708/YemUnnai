import type { ImgHTMLAttributes } from 'react';
import catalogImages from '../lib/catalog-images.json';

type Entry = { width: number; height: number; variants: { src: string; width: number }[] };
const images: Record<string, Entry> = catalogImages;
type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; size?: 'card' | 'detail' | 'thumbnail'; priority?: boolean };

export function CatalogImage({ src, size = 'thumbnail', priority = false, loading, ...props }: Props) {
  const image = images[src];
  const variants = image?.variants.filter(variant => size === 'detail' || variant.width <= 640);
  return <img {...props} src={variants?.[0]?.src ?? src}
    srcSet={variants?.map(variant => `${variant.src} ${variant.width}w`).join(', ')}
    sizes={size === 'card' ? '(max-width: 600px) calc((100vw - 48px) / 2), 208px' : size === 'detail' ? '(max-width: 480px) calc(100vw - 40px), 440px' : '56px'}
    width={props.width ?? image?.width} height={props.height ?? image?.height}
    loading={priority ? 'eager' : loading ?? 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}
