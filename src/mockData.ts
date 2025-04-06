import { atom } from 'jotai';
import { Category } from './types/bookmark';

// 默认分类ID
export const selectedCategoryIdAtom = atom<number | null>(null);

// 分类列表，包括默认分类
export const categoriesAtom = atom<Category[]>([]);