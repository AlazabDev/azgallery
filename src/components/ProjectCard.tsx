import type { ProjectCard as ProjectCardType } from '../types/gallery';
import { ImageWithFallback } from './ImageWithFallback';

interface Props {
  project: ProjectCardType;
  onOpen: (project: ProjectCardType) => void;
}

export function ProjectCard({ project, onOpen }: Props) {
  return (
    <article className="project-card" onClick={() => onOpen(project)} tabIndex={0} role="button"
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onOpen(project)}>
      <div className="project-card__image-wrap">
        <ImageWithFallback className="project-card__image" src={project.coverImageUrl} alt={project.title} loading="lazy" />
        <span className="project-card__count">{project.imageCount} صورة</span>
      </div>
      <div className="project-card__body">
        <div>
          <h2>{project.title}</h2>
          {project.subtitle && <p className="project-card__subtitle">{project.subtitle}</p>}
        </div>
        {project.location && <p className="project-card__location">{project.location}</p>}
        <div className="project-card__footer">
          <span>{project.openCommentCount > 0 ? `${project.openCommentCount} ملاحظة مفتوحة` : 'جاهز للمراجعة'}</span>
          <strong>فتح المعرض</strong>
        </div>
      </div>
    </article>
  );
}
