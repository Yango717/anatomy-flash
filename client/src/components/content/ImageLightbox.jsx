import { useState } from 'react';

export default function ImageLightbox({ src, alt }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt || ''}
        onClick={() => setOpen(true)}
        className="content-img"
        loading="lazy"
      />
      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <button className="lightbox__close" onClick={() => setOpen(false)}>✕</button>
          <img className="lightbox__img" src={src} alt={alt || ''} />
          {alt && <p className="lightbox__caption">{alt}</p>}
        </div>
      )}
    </>
  );
}
