export interface BookmarkNode {
  type: 'folder' | 'link';
  id: string;
  parentId: string | null;
  childrenIds?: string[];
  title: string;
  addDate: string;
  lastModified: string;
  personalToolbarFolder?: boolean; // only for root folder
  href?: string; // only for link
  icon?: string; // only for link
}

export interface BookmarkFile {
  path: string;
  handle: FileSystemFileHandle;
  data: Record<string, BookmarkNode>;
  lastSavedData: string;
  lastSavedHtml: string;
  fileName: string;
}