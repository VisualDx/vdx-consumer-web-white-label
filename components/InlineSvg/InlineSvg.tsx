'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
    src: string;
    className?: string;
    onLoad?: () => void;
};

const svgCache = new Map<string, string>();

export default function InlineSvg({ src, className, onLoad }: Props) {
    const [svg, setSvg] = useState<string>(() => svgCache.get(src) ?? '');

    // ✅ keep latest onLoad without making the fetch effect re-run
    const onLoadRef = useRef<Props['onLoad']>(onLoad);
    useEffect(() => {
        onLoadRef.current = onLoad;
    }, [onLoad]);

    const lastSrcRef = useRef<string>(src);

    useEffect(() => {
        let cancelled = false;

        const fireLoaded = () => {
            queueMicrotask(() => {
                if (!cancelled) onLoadRef.current?.();
            });
        };

        const cached = svgCache.get(src);
        if (cached) {
            setSvg(cached);
            fireLoaded();
            return () => {
                cancelled = true;
            };
        }

        fetch(src)
            .then((res) => res.text())
            .then((text) => {
                if (cancelled) return;
                svgCache.set(src, text);
                setSvg(text);
                fireLoaded();
            })
            .catch(() => {
                if (cancelled) return;
                setSvg('');
            });

        return () => {
            cancelled = true;
        };
    }, [src]); // ✅ only depend on src

    // optional: clear stale svg when src changes (only if not cached)
    useEffect(() => {
        if (lastSrcRef.current !== src) {
            lastSrcRef.current = src;
            if (!svgCache.get(src)) setSvg('');
        }
    }, [src]);

    if (!svg) return null;

    return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}
