interface BaseNode {
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

export interface BookmarkFolderNode extends BaseNode {
  type: 'folder';
  expanded?: boolean;
  sortBy?: 'manual' | 'title' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface BookmarkLinkNode extends BaseNode {
  type: 'link';
  href: string;
  icon?: string;
  tags?: string[];
  cover?: string;
  favorite?: boolean;
  description?: string;
  note?: string;
}

export type BookmarkNode = BookmarkFolderNode | BookmarkLinkNode;