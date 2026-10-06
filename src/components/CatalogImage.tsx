import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import catalogImages from '../lib/catalog-images.json';

type Entry = { width: number; height: number; extracted?: boolean; contentBox?: { left: number; top: number; width: number; height: number }; variants: { src: string; width: number }[] };
const images: Record<string, Entry> = catalogImages;
type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; size?: 'card' | 'detail' | 'thumbnail'; priority?: boolean };

export function CatalogImage({ src, size = 'thumbnail', priority = false, loading, ...props }: Props) {
  const image = images[src];
  const viewport = useRef<HTMLSpanElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!image?.contentBox || !viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [image]);
  if (image?.contentBox) {
    const box = image.contentBox;
    const scale = Math.max(bounds.width / box.width, bounds.height / box.height);
    return <span ref={viewport} className={`catalog-image-crop ${props.className ?? ''}`} style={props.style}>
      <img {...props} className={undefined} src={src} width={image.width} height={image.height}
        loading={priority ? 'eager' : loading ?? 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"
        style={{ position: 'absolute', maxWidth: 'none', width: image.width * scale, height: image.height * scale,
          left: (bounds.width - box.width * scale) / 2 - box.left * scale,
          top: (bounds.height - box.height * scale) / 2 - box.top * scale }} />
    </span>;
  }
  const variants = image?.variants.filter(variant => size === 'detail' || variant.width <= 640);
  return <img {...props} data-extracted={image?.extracted || undefined} src={variants?.[0]?.src ?? src}
    srcSet={variants?.map(variant => `${variant.src} ${variant.width}w`).join(', ')}
    sizes={size === 'card' ? '(max-width: 600px) calc((100vw - 48px) / 2), 208px' : size === 'detail' ? '(max-width: 480px) calc(100vw - 40px), 440px' : '56px'}
    width={props.width ?? image?.width} height={props.height ?? image?.height}
    loading={priority ? 'eager' : loading ?? 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}
