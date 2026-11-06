import { ArticleEditor } from '@/components/article-editor';
export default async function EditArticle({params}:{params:Promise<{id:string}>}){return <ArticleEditor articleId={(await params).id}/>}
