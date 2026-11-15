import type { StickerKind } from "@/lib/model";

export const STICKERS: { kind: StickerKind; label: string }[] = [
  { kind: "planet", label: "Saturn" },
  { kind: "star", label: "Golden star" },
  { kind: "rocket", label: "Little rocket" },
  { kind: "moon", label: "Moon" },
  { kind: "heart", label: "Love" },
  { kind: "flower", label: "Wildflower" },
  { kind: "earth", label: "Earth" },
  { kind: "sparkles", label: "Stardust" },
  { kind: "stamp", label: "Still here stamp" },
  { kind: "rainbow", label: "Rainbow" },
];

/** Original, code-native die-cut illustrations: no downloaded sticker assets. */
export function StickerArt({ kind }: { kind: StickerKind }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
      {kind === "planet" && (
        <>
          <path
            d="M21 48C23 20 55 6 80 21c14 8 22 24 20 38 23 13 9 30-22 33-22 15-50 4-57-14C-5 66 0 48 21 48Z"
            fill="#fff7e8"
            stroke="#fff7e8"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <circle
            cx="61"
            cy="56"
            r="37"
            fill="#ada1c4"
            stroke="#3e4d69"
            strokeWidth="2.5"
          />
          <path
            d="M29 39c14 8 17-4 31 0s16 13 34 8M26 57c16 6 23-6 34-1s19 14 37 9M35 77c13-2 23-3 33 7"
            stroke="#799989"
            strokeWidth="10"
          />
          <path
            d="M26 48C-4 41 1 63 50 78c37 11 65 7 63-4-1-4-5-7-14-12"
            stroke="#3e4d69"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M26 48C-4 41 1 63 50 78c37 11 65 7 63-4-1-4-5-7-14-12"
            stroke="#dba66d"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M19 52c-10 3 10 17 36 24 26 8 48 9 52 2"
            stroke="#f4d494"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "star" && (
        <>
          <path
            d="m60 9 16 31 35 5-25 25 6 35-32-17-32 17 6-35L9 45l35-5L60 9Z"
            fill="#d9aa52"
            stroke="#fff7e8"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="m60 21 12 25 28 4-20 19 5 27-25-13-25 13 5-27-20-19 28-4 12-25Z"
            stroke="#ad803d"
            strokeWidth="1.6"
            strokeDasharray="3 3"
            strokeLinejoin="round"
          />
          <path
            d="m46 59 9 8 20-20"
            stroke="#fff2cb"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "rocket" && (
        <>
          <path
            d="M61 7c18 14 28 39 24 64l13 22-24-3-13 23-13-23-24 3 14-22C33 45 43 21 61 7Z"
            fill="#fff7e8"
            stroke="#fff7e8"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path d="m47 77 14 31 13-31" fill="#d8aa60" />
          <path
            d="m38 63-14 30 23-8M84 63l14 30-24-8"
            fill="#73908e"
            stroke="#415a6c"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M61 10C42 28 34 56 44 84h34C87 56 80 28 61 10Z"
            fill="#e5d5ba"
            stroke="#415a6c"
            strokeWidth="2.5"
          />
          <path
            d="M43 35h35C74 23 68 16 61 10c-8 7-14 15-18 25Z"
            fill="#b67c65"
            stroke="#415a6c"
            strokeWidth="2"
          />
          <circle
            cx="61"
            cy="54"
            r="13"
            fill="#83a7b4"
            stroke="#415a6c"
            strokeWidth="3"
          />
          <path
            d="m55 48 7-2"
            stroke="#eaf1e5"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M52 83v8h18v-8" fill="#415a6c" />
        </>
      )}
      {kind === "moon" && (
        <>
          <path
            d="M76 12C46 6 18 29 18 60s28 54 58 48c13-3 23-10 29-21-30 9-55-10-55-37 0-17 10-31 26-38Z"
            fill="#e2c887"
            stroke="#fff7e8"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="M76 12C46 6 18 29 18 60s28 54 58 48c13-3 23-10 29-21-30 9-55-10-55-37 0-17 10-31 26-38Z"
            stroke="#a28658"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="34" cy="59" r="5" fill="#c8ab70" />
          <circle cx="45" cy="83" r="7" fill="#c8ab70" />
          <circle cx="49" cy="30" r="3" fill="#c8ab70" />
          <path d="m91 24 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#708392" />
        </>
      )}
      {kind === "heart" && (
        <>
          <path
            d="M60 104C38 88 12 69 12 44 12 15 45 10 60 30 75 10 108 15 108 44c0 25-26 44-48 60Z"
            fill="#bb897d"
            stroke="#fff7e8"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="M60 95C38 79 21 63 21 44c0-20 24-25 39-5 15-20 39-15 39 5 0 19-17 35-39 51Z"
            stroke="#94645e"
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />
          <path
            d="M31 40c2-6 6-9 12-8"
            stroke="#f5d6bd"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "flower" && (
        <>
          <path
            d="M58 59v47M58 91C35 96 27 80 28 71c17-2 28 8 30 20ZM59 83c18 2 31-8 32-20-20-1-30 8-32 20Z"
            stroke="#fff7e8"
            strokeWidth="15"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M58 59v47"
            stroke="#6b8261"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M58 91C35 96 27 80 28 71c17-2 28 8 30 20ZM59 83c18 2 31-8 32-20-20-1-30 8-32 20Z"
            fill="#899b70"
          />
          <path
            d="M44 34C26 9 48 0 59 19 71-2 94 11 78 33c29-4 30 24 5 25 11 24-16 34-24 10-12 24-34 10-23-10C10 55 17 27 44 34Z"
            fill="#b7a2b5"
            stroke="#fff7e8"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <circle
            cx="60"
            cy="44"
            r="14"
            fill="#ddba69"
            stroke="#9e7b46"
            strokeWidth="2"
          />
          <circle cx="56" cy="40" r="2" fill="#a17e48" />
          <circle cx="65" cy="45" r="2" fill="#a17e48" />
          <circle cx="57" cy="49" r="2" fill="#a17e48" />
        </>
      )}
      {kind === "earth" && (
        <>
          <circle
            cx="60"
            cy="60"
            r="47"
            fill="#83a1b7"
            stroke="#fff7e8"
            strokeWidth="10"
          />
          <circle cx="60" cy="60" r="46" stroke="#41576c" strokeWidth="2" />
          <path
            d="m28 27 20-10 15 5 6 10-14 7 3 11-11 12-5-7-15-2-8-12 9-14ZM51 66l14 1 11 12-6 17-9 9-5-17-10-7 5-15ZM90 28l-12 6 2 12-10 8 8 10 17-3 9 8 3-20-9-18-8-3Z"
            fill="#9da97a"
            stroke="#6d8668"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M30 70c9 10 27 15 37 11M56 26c13 0 23 7 31 16"
            stroke="#e8ecdb"
            strokeOpacity=".6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "sparkles" && (
        <>
          <path
            d="m52 14 10 29 30 10-30 11-10 30-10-30-30-11 30-10 10-29ZM93 70l5 14 15 5-15 6-5 15-5-15-15-6 15-5 5-14ZM90 8l4 10 10 4-10 4-4 11-4-11-10-4 10-4 4-10Z"
            fill="#d7b56d"
            stroke="#fff7e8"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path
            d="m52 14 10 29 30 10-30 11-10 30-10-30-30-11 30-10 10-29Z"
            stroke="#ab8b54"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="25" cy="98" r="4" fill="#8396a1" />
        </>
      )}
      {kind === "stamp" && (
        <>
          <path
            d="m28 9 64 0 17 21-8 62-41 22-41-22-8-62L28 9Z"
            fill="#dfb17c"
            stroke="#fff7e8"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <path
            d="m32 17 56 0 13 16-7 54-34 19-34-19-7-54 13-16Z"
            fill="#42566b"
            stroke="#e6cc9d"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <path
            d="M36 68c16-17 32-20 49-17M37 69c10 3 33-3 46-15"
            stroke="#bd9cb8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="61" cy="58" r="10" fill="#bf9eb9" />
          <text
            x="60"
            y="39"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Georgia, serif"
            fill="#fff0d3"
            letterSpacing="1"
          >
            STILL
          </text>
          <text
            x="60"
            y="87"
            textAnchor="middle"
            fontSize="15"
            fontFamily="Georgia, serif"
            fill="#fff0d3"
            letterSpacing="1"
          >
            HERE
          </text>
        </>
      )}
      {kind === "rainbow" && (
        <>
          <path
            d="M14 99V63a46 46 0 0 1 92 0v36H14Z"
            fill="#fff7e8"
            stroke="#fff7e8"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="M20 97V63a40 40 0 0 1 80 0v34"
            stroke="#b88272"
            strokeWidth="12"
          />
          <path
            d="M32 97V63a28 28 0 0 1 56 0v34"
            stroke="#d8b16f"
            strokeWidth="12"
          />
          <path
            d="M44 97V63a16 16 0 0 1 32 0v34"
            stroke="#8a9a7c"
            strokeWidth="12"
          />
          <path
            d="M55 98V63a5 5 0 0 1 10 0v35"
            stroke="#9aa8b4"
            strokeWidth="10"
          />
        </>
      )}
    </svg>
  );
}
