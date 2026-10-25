import { useState } from "react";
import catalogue from "./nasa-images.json";
import type { Body } from "./model";
type Photo = {
  id: string;
  title: string;
  url: string;
  source: string;
  credit: string;
};
const galleries: Record<string, Photo[]> = catalogue;
export default function NasaCarousel({ body }: { body: Body }) {
  const subject = galleries[body.name] ? body.name : body.parent;
  const images = subject ? galleries[subject] : undefined;
  if (!images?.length)
    return (
      <p className="gallery-note">
        No NASA photographs are available for this body.
      </p>
    );
  return (
    <Gallery
      key={body.id}
      images={images}
      subject={subject!}
      fallback={subject !== body.name}
      bodyName={body.name}
    />
  );
}
function Gallery({
  images,
  subject,
  fallback,
  bodyName,
}: {
  images: Photo[];
  subject: string;
  fallback: boolean;
  bodyName: string;
}) {
  const [index, setIndex] = useState(0),
    [failed, setFailed] = useState<Record<string, boolean>>({});
  const photo = images[index];
  return (
    <section
      className="nasa-gallery"
      aria-label={`${subject} NASA image carousel`}
      aria-roledescription="carousel"
    >
      <div className="gallery-topline">
        <span>NASA IMAGE ARCHIVE</span>
        <span aria-live="polite">
          {index + 1} / {images.length}
        </span>
      </div>
      {fallback && (
        <p className="gallery-note">
          No curated photographs of {bodyName}. Showing its parent, {subject}.
        </p>
      )}
      <figure>
        <div className="photo-frame">
          {failed[photo.id] ? (
            <p role="status">
              NASA image is temporarily unavailable.
              <br />
              <a href={photo.source} target="_blank" rel="noreferrer">
                View original at NASA ↗
              </a>
            </p>
          ) : (
            <img
              key={photo.id}
              src={photo.url}
              alt={`${subject}: ${photo.title}`}
              decoding="async"
              onError={() => setFailed((f) => ({ ...f, [photo.id]: true }))}
            />
          )}
          <button
            className="photo-prev"
            aria-label="Previous NASA image"
            onClick={() =>
              setIndex((i) => (i + images.length - 1) % images.length)
            }
          >
            ‹
          </button>
          <button
            className="photo-next"
            aria-label="Next NASA image"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
          >
            ›
          </button>
        </div>
        <figcaption>
          <a href={photo.source} target="_blank" rel="noreferrer">
            {photo.title} ↗
          </a>
          <small>{photo.credit}</small>
        </figcaption>
      </figure>
      <div className="photo-pagination">
        {images.map((image, i) => (
          <button
            key={image.id}
            aria-label={`Show NASA image ${i + 1}`}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}
