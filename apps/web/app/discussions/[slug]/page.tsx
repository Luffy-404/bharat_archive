import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
export default async function Discussion({params}:{params:Promise<{slug:string}>}) {
  const d=await api<any>(`/discussions/${(await params).slug}`); if(!d) notFound();
  return <article className="prose"><p className="meta">{d.kind.toLowerCase()} · by <a href={`/profiles/${d.author.id}`}>{d.author.displayName}</a></p><h1>{d.title}</h1><p>{d.body}</p><h2>Answers and replies</h2>{d.comments.length?d.comments.map((c:any)=><section className="item" key={c.id}><p>{c.body}</p><p className="meta">{c.author.displayName}</p>{c.replies.map((r:any)=><p key={r.id}>↳ {r.body} — {r.author.displayName}</p>)}</section>):<p>No replies yet. Sign in to contribute.</p>}</article>;
}
