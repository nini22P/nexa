interface BookmarkBaseItem {
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

export interface BookmarkFolderItem extends BookmarkBaseItem {
  type: 'folder';
  expanded?: boolean;
  sortBy?: 'manual' | 'title' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface BookmarkLinkItem extends BookmarkBaseItem {
  type: 'link';
  href: string;
  icon?: string;
  tags?: string[];
  cover?: string;
  favorite?: boolean;
  description?: string;
  note?: string;
}

export type BookmarkItem = BookmarkFolderItem | BookmarkLinkItem;

export type BookmarkItems = Record<string, BookmarkItem>;