import { CheckCheck, Cloud, Feather, Heart, Send } from "lucide-react";
import {
  PEOPLE,
  formatDate,
  getStatusLabel,
  type Contribution,
} from "@/lib/model";
import ScrapbookPage from "./ScrapbookPage";

type Props = {
  page: Contribution;
  pageIndex: number;
  profileId: string;
  presentation?: boolean;
};

const authorName = (id: string) =>
  PEOPLE.find((person) => person.id === id)?.name ?? "Someone close";
const statusIcon = (page: Contribution) =>
  page.status === "recorded"
    ? Cloud
    : page.status === "sent"
      ? Send
      : page.status === "answered"
        ? Heart
        : CheckCheck;

/** One identical physical leaf for the reader and its decorative opening counterpart. */
export default function AlbumLeaf({
  page,
  pageIndex,
  profileId,
  presentation = false,
}: Props) {
  const Icon = statusIcon(page);
  const own = page.authorId === profileId;
  const Container = presentation ? "div" : "article";

  return (
    <Container
      className="book-leaf-inner"
      aria-label={
        presentation ? undefined : `Page ${pageIndex + 1}: ${page.title}`
      }
      aria-hidden={presentation ? true : undefined}
    >
      <header className="leaf-header">
        <span>
          {own ? "A page from you" : `A page from ${authorName(page.authorId)}`}
        </span>
        <Feather size={12} />
      </header>
      <div
        className="leaf-content"
        data-opf-no-flip=""
        tabIndex={presentation ? undefined : 0}
        role={presentation ? undefined : "region"}
        aria-label={
          presentation
            ? undefined
            : `Read page ${pageIndex + 1} by ${authorName(page.authorId)}`
        }
      >
        <ScrapbookPage
          title={page.title}
          text={page.text}
          photo={page.photo}
          design={page.design}
        />
      </div>
      <footer className="leaf-footer">
        <time dateTime={page.createdAt}>
          {formatDate(page.createdAt)} · UTC
        </time>
        <span className={`leaf-status leaf-status-${page.status}`}>
          <Icon size={11} />
          {getStatusLabel(page.status)}
        </span>
      </footer>
      <span className="leaf-page-number" aria-hidden="true">
        {String(pageIndex + 1).padStart(2, "0")}
      </span>
    </Container>
  );
}
