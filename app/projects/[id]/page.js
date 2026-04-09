import { defaultProjects } from "../../../lib/storage";
import ProjectDetailClient from "./ProjectDetailClient";

export function generateStaticParams() {
  return defaultProjects.map((project) => ({ id: project.id }));
}

export default function ProjectDetailPage({ params }) {
  return <ProjectDetailClient projectId={params.id} />;
}
