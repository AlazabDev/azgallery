import type { GalleryComment, GalleryImage, ProjectCard } from '../types/gallery';

export interface AdminProject extends ProjectCard {
  status: 'active' | 'archived';
  isPublic: boolean;
  createdAt: string;
}

export interface AdminComment extends GalleryComment {
  projectSlug: string;
  projectTitle: string;
  imageTitle: string | null;
}

export interface AdminImage extends GalleryImage {
  status: 'active' | 'archived';
}
