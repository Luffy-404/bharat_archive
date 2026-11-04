import { api } from '@/lib/api';
export const metadata={title:'Discussions'};
export default async function Discussions(){const ds=await api<any[]>('/discussions')||[];return <section className="prose"><h1>Discussions</h1>{ds.length?ds.map((d:any)=><article className="item" key={d.slug}><h2><a href={`/discussions/${d.slug}`}>{d.title}</a></h2><p>{d.body}</p><p className="meta">{d.kind.toLowerCase()} · {d.author.displayName} · {d._count.comments} replies</p></article>):<p className="empty">No public discussions yet.</p>}</section>}
