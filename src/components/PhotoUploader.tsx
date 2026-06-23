import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { useAlbumStore } from '../store/albumStore';
import { createUserPhotos } from '../utils/image';
import { useTranslation } from '../i18n';

export function PhotoUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const addPhotos = useAlbumStore((state) => state.addPhotos);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setIsLoading(true);
    try {
      const photos = await createUserPhotos(files);
      addPhotos(photos);
    } finally {
      setIsLoading(false);
    }
  }

  async function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) await handleFiles(event.target.files);
    event.target.value = '';
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) await handleFiles(event.dataTransfer.files);
  }

  return (
    <section className="panel-section">
      <div className="section-heading">
        <span className="step-badge">3</span>
        <div>
          <h2>{t('uploadTitle')}</h2>
          <p>{t('uploadDesc')}</p>
        </div>
      </div>
      <div
        className={isDragging ? 'upload-zone dragging' : 'upload-zone'}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onInputChange} />
        <strong>{isLoading ? t('loadingImages') : t('uploadCta')}</strong>
        <span>{t('uploadHint')}</span>
      </div>
    </section>
  );
}
