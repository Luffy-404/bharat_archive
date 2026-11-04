import { PrismaClient, PublicationStatus, DiscussionKind, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
const db = new PrismaClient();
async function main() {
 const editor=await db.user.upsert({where:{email:'editor@example.test'},update:{},create:{email:'editor@example.test',displayName:'Development Editor',passwordHash:await hash('development-only-password',12),role:Role.EDITOR}});
 const history=await db.topic.upsert({where:{slug:'history'},update:{},create:{slug:'history',name:'History',description:'Historical context, records, and public memory.'}});
 const assam=await db.topic.upsert({where:{slug:'assam'},update:{},create:{slug:'assam',name:'Assam',description:'Knowledge and community discussions related to Assam.',parentId:history.id}});
 const article=await db.article.upsert({where:{slug:'getting-started'},update:{},create:{slug:'getting-started',title:'A development example for BharatArchive',summary:'This clearly labelled sample shows the first-version content structure.',content:'This is development seed content, not a factual reference article. Replace it with independently sourced, reviewed material before public use.',status:PublicationStatus.PUBLISHED,authorId:editor.id,publishedAt:new Date(),topics:{create:[{topicId:history.id},{topicId:assam.id}]},sources:{create:{title:'Development seed notice',url:'https://example.test',license:'Not for publication'}}}});
 await db.articleRevision.upsert({where:{id:'seed-revision'},update:{},create:{id:'seed-revision',articleId:article.id,authorId:editor.id,title:article.title,content:article.content,note:'Initial development seed'}});
 await db.discussion.upsert({where:{slug:'how-should-development-examples-be-reviewed'},update:{},create:{slug:'how-should-development-examples-be-reviewed',title:'How should development examples be reviewed?',body:'A seeded question for testing community workflows. It is not a factual claim.',kind:DiscussionKind.QUESTION,authorId:editor.id,topics:{create:{topicId:history.id}}}});
}
main().finally(()=>db.$disconnect());
