export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  icon: string;
  categoryId: number;
  description: string;
}