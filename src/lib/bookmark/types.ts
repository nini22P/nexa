interface BookmarkItemBase {
  id: string;
  parentId: string | null;
  title: string;
  addDate: number;
  lastModified: number;
  deletedAt?: number;
  lastVisited?: number;
  visitCount?: number;
  rawAttributes?: Record<string, string>;
}

export interface BookmarkItemFolder extends BookmarkItemBase {
  type: 'folder';
  expanded?: boolean;
  sortBy?: 'manual' | 'title' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface BookmarkItemLink extends BookmarkItemBase {
  type: 'link';
  href: string;
  icon?: string;
  tags?: string[];
  cover?: string;
  favorite?: boolean;
  description?: string;
  note?: string;
}

export type BookmarkItem = BookmarkItemFolder | BookmarkItemLink;

export type BookmarkItems = Record<string, BookmarkItem>;

export type BookmarkItemDraft =
  | Partial<BookmarkItemFolder> & Pick<BookmarkItemFolder, 'type' | 'title' | 'parentId'>
  | Partial<BookmarkItemLink> & Pick<BookmarkItemLink, 'type' | 'title' | 'parentId'>