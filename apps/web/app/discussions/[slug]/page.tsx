import { ContentReportForm } from '@/components/content-report-form';
import { DiscussionReplyForm } from '@/components/discussion-reply-form';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';

export default async function Discussion({params}:{params:Promise<{slug:string}>}){
 const d=await api<any>(`/discussions/${(await params).slug}`);
 if(!d)notFound();
 return <article className="discussion-page"><p className="discussion-meta">{d.kind.toLowerCase()} · by <a href={`/profiles/${d.author.id}`}>{d.author.displayName}</a> · {new Date(d.createdAt).toLocaleDateString('en-IN')}</p><h1>{d.title}</h1>{d.topics.length>0&&<p className="discussion-topics">{d.topics.map((item:any)=><a className="discussion-topic" key={item.topic.id} href={`/topics/${item.topic.slug}`}>{item.topic.name}</a>)}</p>}<p className="discussion-body">{d.body}</p><ContentReportForm discussionId={d.id} label="Report discussion"/><section className="discussion-replies"><h2>Replies</h2>{d.comments.length?d.comments.map((comment:any)=><article className="discussion-comment" key={comment.id}><p>{comment.body}</p><p className="discussion-meta">{comment.author.displayName} · {new Date(comment.createdAt).toLocaleDateString('en-IN')}</p><ContentReportForm commentId={comment.id} label="Report reply"/>{comment.replies.map((reply:any)=><div className="reply-item" key={reply.id}><p>{reply.body}</p><p className="discussion-meta">{reply.author.displayName} · {new Date(reply.createdAt).toLocaleDateString('en-IN')}</p><ContentReportForm commentId={reply.id} label="Report reply"/></div>)}</article>):<p>No replies yet.</p>}</section><DiscussionReplyForm discussionId={d.id}/></article>
}
