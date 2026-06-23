import { PointerEvent, WheelEvent, useRef } from 'react';
import type { AlbumPage, PhotoFrameTemplate, UserPhoto } from '../templates/templateTypes';
import { useAlbumStore } from '../store/albumStore';
import { useTranslation } from '../i18n';

type PhotoFrameProps = {
  page: AlbumPage;
  frame: PhotoFrameTemplate;
  photo?: UserPhoto;
  previewScale: number;
};

export function PhotoFrame({ page, frame, photo, previewScale }: PhotoFrameProps) {
  const state = page.frameStates[frame.id];
  const updateFrameState = useAlbumStore((store) => store.updateFrameState);
  const resetFrameState = useAlbumStore((store) => store.resetFrameState);
  const { t } = useTranslation();
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  if (!photo) {
    return (
      <div className="photo-frame empty" style={frameStyle(frame)}>
        <span>{t('emptyFrame')}</span>
      </div>
    );
  }

  function updateScale(delta: number) {
    const next = Math.min(3, Math.max(0.5, (state?.scale ?? 1) + delta));
    updateFrameState(page.id, frame.id, { scale: Number(next.toFixed(2)) });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('.frame-controls')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: state?.offsetX ?? 0,
      offsetY: state?.offsetY ?? 0,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    updateFrameState(page.id, frame.id, {
      offsetX: drag.offsetX + (event.clientX - drag.x) / previewScale,
      offsetY: drag.offsetY + (event.clientY - drag.y) / previewScale,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey && !event.altKey) return;
    event.preventDefault();
    updateScale(event.deltaY > 0 ? -0.05 : 0.05);
  }

  return (
    <div
      className="photo-frame"
      style={frameStyle(frame)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      title={t('frameTitle')}
    >
      <img
        src={photo.url}
        alt={photo.name}
        draggable={false}
        style={{
          transform: `translate(${state?.offsetX ?? 0}px, ${state?.offsetY ?? 0}px) scale(${state?.scale ?? 1})`,
        }}
      />
      <div className="frame-controls">
        <button type="button" aria-label={t('zoomOut')} onClick={() => updateScale(-0.05)}>−</button>
        <button type="button" aria-label={t('reset')} onClick={() => resetFrameState(page.id, frame.id)}>↺</button>
        <button type="button" aria-label={t('zoomIn')} onClick={() => updateScale(0.05)}>＋</button>
      </div>
    </div>
  );
}

function frameStyle(frame: PhotoFrameTemplate) {
  return {
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    transform: `rotate(${frame.rotation || 0}deg)`,
    borderRadius: frame.radius,
  } as const;
}
