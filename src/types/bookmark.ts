export interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary?: string;
  tags?: string[];
  category?: string;
  icon?: string;
  dateAdded: number;
}

export interface Category {
  id: string;
  name: string;
  bookmarkIds: string[];
}