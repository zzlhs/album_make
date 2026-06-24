import { PointerEvent, useRef } from 'react';
import type { AlbumPage, PhotoFrameTemplate, UserPhoto } from '../templates/templateTypes';
import { useAlbumStore } from '../store/albumStore';
import { useTranslation } from '../i18n';
import { resolveFrame } from '../utils/frameState';

type PhotoFrameProps = {
  page: AlbumPage;
  frame: PhotoFrameTemplate;
  photo?: UserPhoto;
  previewScale: number;
  pageWidth: number;
  pageHeight: number;
};

export function PhotoFrame({ page, frame, photo, previewScale, pageWidth, pageHeight }: PhotoFrameProps) {
  const state = page.frameStates[frame.id];
  const updateFrameState = useAlbumStore((store) => store.updateFrameState);
  const resetFrameState = useAlbumStore((store) => store.resetFrameState);
  const selectedFrameId = useAlbumStore((store) => store.selectedFrameId);
  const selectFrame = useAlbumStore((store) => store.selectFrame);
  const { t } = useTranslation();
  const dragRef = useRef<{ x: number; y: number; frameX: number; frameY: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number; frameW: number; frameH: number } | null>(null);

  if (!photo) {
    return (
      <div className="photo-frame empty" style={frameStyle(frame)}>
        <span>{t('emptyFrame')}</span>
      </div>
    );
  }

  const resolved = resolveFrame(frame, state);
  const isSelected = selectedFrameId === frame.id;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('.frame-controls') || target.closest('.frame-resize-handle')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectFrame(page.id, frame.id);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      frameX: resolved.x,
      frameY: resolved.y,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      const drag = dragRef.current;
      const dx = (event.clientX - drag.x) / previewScale;
      const dy = (event.clientY - drag.y) / previewScale;
      const newX = Math.max(0, Math.min(pageWidth - resolved.width, drag.frameX + dx));
      const newY = Math.max(0, Math.min(pageHeight - resolved.height, drag.frameY + dy));
      updateFrameState(page.id, frame.id, { x: Number(newX.toFixed(1)), y: Number(newY.toFixed(1)) });
    }
    if (resizeRef.current) {
      const resize = resizeRef.current;
      const dx = (event.clientX - resize.x) / previewScale;
      const dy = (event.clientY - resize.y) / previewScale;
      const newW = Math.max(48, resize.frameW + dx);
      const newH = Math.max(48, resize.frameH + dy);
      updateFrameState(page.id, frame.id, { width: Number(newW.toFixed(1)), height: Number(newH.toFixed(1)) });
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    resizeRef.current = null;
  }

  function onResizePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    const parent = (event.currentTarget as HTMLElement).closest('.photo-frame') as HTMLElement;
    if (parent) parent.setPointerCapture(event.pointerId);
    selectFrame(page.id, frame.id);
    resizeRef.current = {
      x: event.clientX,
      y: event.clientY,
      frameW: resolved.width,
      frameH: resolved.height,
    };
  }

  function onRotate(direction: 'left' | 'right') {
    const current = resolved.rotation || 0;
    const delta = direction === 'left' ? -15 : 15;
    updateFrameState(page.id, frame.id, { rotation: Number(((current + delta) % 360).toFixed(1)) });
  }

  return (
    <div
      className={`photo-frame${isSelected ? ' selected' : ''}`}
      style={frameStyle(resolved)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={photo.url}
        alt={photo.name}
        draggable={false}
      />
      <div className="frame-resize-handle" onPointerDown={onResizePointerDown}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M12 0v12H0l12-12z" fill="currentColor" />
        </svg>
      </div>
      <div className="frame-controls">
        <button type="button" aria-label={t('rotateLeft') || 'Rotate left'} onClick={() => onRotate('left')}>↶</button>
        <button type="button" aria-label={t('rotateRight') || 'Rotate right'} onClick={() => onRotate('right')}>↷</button>
        <button type="button" aria-label={t('reset')} onClick={() => resetFrameState(page.id, frame.id)}>↺</button>
      </div>
    </div>
  );
}

function frameStyle(frame: { x: number; y: number; width: number; height: number; rotation?: number; radius?: number }) {
  return {
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    transform: `rotate(${frame.rotation || 0}deg)`,
    borderRadius: frame.radius,
  } as const;
}
