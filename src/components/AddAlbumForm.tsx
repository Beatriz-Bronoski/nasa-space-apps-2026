"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, UserRoundPlus } from "lucide-react";
import {
  ALBUMS,
  DEFAULT_ALBUM_COVER,
  MAX_ALBUM_TITLE_LENGTH,
  MAX_PERSON_NAME_LENGTH,
  type Person,
} from "@/lib/model";
import { compressPhoto } from "@/lib/storage";
import "./add-album-form.css";

export type AlbumInput = {
  title: string;
  personId?: string;
  newPersonName?: string;
  cover?: string;
};

type Props = {
  people: Person[];
  defaultPersonId: string;
  canAddPerson: boolean;
  onCreate: (input: AlbumInput) => void;
};

export default function AddAlbumForm({
  people,
  defaultPersonId,
  canAddPerson,
  onCreate,
}: Props) {
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState(defaultPersonId);
  const [newPerson, setNewPerson] = useState(false);
  const [name, setName] = useState("");
  const [cover, setCover] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadVersion = useRef(0);
  const defaultCover = newPerson
    ? DEFAULT_ALBUM_COVER
    : (ALBUMS.find((album) => album.personId === personId)?.cover ??
      DEFAULT_ALBUM_COVER);

  const chooseCover = async (file?: File) => {
    if (!file) return;
    const version = ++uploadVersion.current;
    setBusy(true);
    setPhotoError("");
    try {
      const photo = await compressPhoto(file);
      if (version === uploadVersion.current) setCover(photo);
    } catch (cause) {
      if (version === uploadVersion.current)
        setPhotoError(
          cause instanceof Error
            ? cause.message
            : "This photo could not be opened.",
        );
    } finally {
      if (version === uploadVersion.current) setBusy(false);
    }
  };

  return (
    <form
      className="album-create-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        setError("");
        try {
          onCreate({
            title,
            ...(newPerson ? { newPersonName: name } : { personId }),
            ...(cover ? { cover } : {}),
          });
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "This album could not be created.",
          );
        }
      }}
    >
      <label className="field-label" htmlFor="new-album-title">
        Album title
      </label>
      <input
        id="new-album-title"
        className="story-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="A place for little memories"
        maxLength={MAX_ALBUM_TITLE_LENGTH}
        required
      />

      <div className="album-person-heading">
        <label
          className="field-label"
          htmlFor={newPerson ? "new-person-name" : "new-album-person"}
        >
          Share with
        </label>
        {canAddPerson && (
          <button
            className="album-person-toggle"
            type="button"
            aria-pressed={newPerson}
            onClick={() => {
              setNewPerson(!newPerson);
              setError("");
            }}
          >
            <UserRoundPlus size={16} />
            {newPerson ? "Choose from my circle" : "Someone new"}
          </button>
        )}
      </div>
      {newPerson ? (
        <input
          id="new-person-name"
          className="story-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Their name"
          maxLength={MAX_PERSON_NAME_LENGTH}
          autoComplete="off"
          required
        />
      ) : (
        <select
          id="new-album-person"
          className="profile-select"
          value={personId}
          onChange={(event) => setPersonId(event.target.value)}
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      )}

      <div className="album-cover-picker">
        <div className="album-cover-sample">
          <img
            src={cover ?? defaultCover}
            alt={cover ? "Your chosen album cover" : "Default album cover"}
          />
          <span>
            {newPerson
              ? name.trim() || "Someone close"
              : people.find((person) => person.id === personId)?.name}{" "}
            &amp; Alex
          </span>
        </div>
        <div className="album-cover-controls">
          <span className="field-label">
            Cover photo <span className="album-optional">(optional)</span>
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={17} />
            {busy
              ? "Preparing photo…"
              : cover
                ? "Change photo"
                : "Choose photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose an album cover photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              void chooseCover(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {cover && (
            <button
              type="button"
              className="album-remove-cover"
              disabled={busy}
              onClick={() => setCover(undefined)}
            >
              <Trash2 size={14} />
              Remove photo
            </button>
          )}
          <small>JPEG, PNG or WebP · Up to 10 MB</small>
        </div>
      </div>
      {photoError && (
        <p className="field-error" role="alert">
          {photoError}
        </p>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <p className="album-local-note">
        Saved on this device. No invitation is sent.
      </p>
      <button className="primary-button" type="submit" disabled={busy}>
        <Plus size={17} />
        Add album
      </button>
    </form>
  );
}
