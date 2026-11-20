import ProjectStudio from '@/components/grows/ProjectStudio';
import { notFound } from 'next/navigation';
export default async function StudioPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id))notFound();
 return <ProjectStudio obraId={id}/>;
}
