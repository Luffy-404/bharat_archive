const base=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api';
export async function api<T>(path:string):Promise<T|null>{try{const r=await fetch(`${base}${path}`,{next:{revalidate:60}});return r.ok?await r.json():null}catch{return null}}
export type Article={slug:string;title:string;summary:string;publishedAt:string;updatedAt:string;content?:string;author:{id:string;displayName:string};topics:{topic:{slug:string;name:string}}[];sources?:{title:string;url:string;license?:string;accessedAt?:string}[];revisions?:{id:string;createdAt:string;note?:string;author:{displayName:string}}[]};
