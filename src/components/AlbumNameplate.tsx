import { PEOPLE, type Album } from "@/lib/model";
import "./album-nameplate.css";

type Props = {
  album: Album;
  presentation?: boolean;
};

function OliveSprig({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      className={`album-nameplate-sprig${mirrored ? " is-mirrored" : ""}`}
      viewBox="0 0 28 34"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 30C10 23 15 15 21 4" />
      <path d="M10 24C3 25 2 21 3 17c6-1 10 1 7 7ZM13 19c-1-6 1-9 5-10 3 5 1 8-5 10ZM16 14c-5 0-8-3-7-7 5-1 8 2 7 7ZM19 8c-1-5 1-7 5-7 2 5 0 7-5 7ZM8 27c5 1 8 0 10-4-5-3-8-1-10 4Z" />
    </svg>
  );
}

/** A sewn-in label shared by the open album and its moving cover presentation. */
export default function AlbumNameplate({ album, presentation = false }: Props) {
  const companion = PEOPLE.find((person) => person.id === album.personId)?.name;
  const astronaut = PEOPLE.find((person) => person.role === "Astronaut")?.name;
  const names = `${companion ?? "Someone close"} & ${astronaut ?? "Alex"}`;

  return (
    <div
      className="album-nameplate"
      aria-hidden={presentation ? true : undefined}
    >
      <span className="album-nameplate-ribbon" aria-hidden="true" />
      <span className="album-nameplate-tag">
        <OliveSprig />
        <span className="album-nameplate-names">{names}</span>
        <OliveSprig mirrored />
      </span>
    </div>
  );
}
