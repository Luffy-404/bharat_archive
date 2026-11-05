import { ArticlesController, Db, DiscussionsController, SearchController, TopicsController, publicAuthorSelect } from './api.module';
import { NotFoundException } from '@nestjs/common';

const articleInput={title:'A valid article title',slug:'valid-article',summary:'A sufficiently long article summary for the validation contract.',content:'A sufficiently long article body that satisfies the configured minimum content length.'};
const discussionInput={title:'A valid discussion',slug:'valid-discussion',body:'A sufficiently long discussion body.'};

describe('public response safety',()=>{
 it('limits public author fields to an explicit safe projection',()=>{
  expect(publicAuthorSelect).toEqual({id:true,displayName:true});
  expect(publicAuthorSelect).not.toHaveProperty('passwordHash');
  expect(publicAuthorSelect).not.toHaveProperty('email');
 });

 it('uses safe author projections for article list and detail responses',async()=>{
  const findMany=jest.fn().mockResolvedValue([]);const findFirst=jest.fn().mockResolvedValue(null);
  const controller=new ArticlesController({article:{findMany,findFirst}} as unknown as Db);
  await controller.list();await expect(controller.one('missing')).rejects.toBeInstanceOf(NotFoundException);
  expect(findMany.mock.calls[0][0].include.author.select).toEqual(publicAuthorSelect);
  expect(findFirst.mock.calls[0][0].include.author.select).toEqual(publicAuthorSelect);
  expect(findFirst.mock.calls[0][0].include.revisions.include.author.select).toEqual(publicAuthorSelect);
 });

 it('uses safe author projections for topic, discussion, and search public queries',async()=>{
  const topicFindUnique=jest.fn().mockResolvedValue({});
  const discussionFindMany=jest.fn().mockResolvedValue([]);const discussionFindFirst=jest.fn().mockResolvedValue(null);
  const articleFindMany=jest.fn().mockResolvedValue([]);const searchTopicFindMany=jest.fn().mockResolvedValue([]);
  const db={topic:{findUnique:topicFindUnique},client:{discussion:{findMany:discussionFindMany,findFirst:discussionFindFirst},article:{findMany:articleFindMany},topic:{findMany:searchTopicFindMany}}} as unknown as Db;
  await new TopicsController(db).one('history');await expect(new DiscussionsController(db).one('missing')).rejects.toBeInstanceOf(NotFoundException);await new SearchController(db).search('history');
  const topicInclude=topicFindUnique.mock.calls[0][0].include;
  expect(topicInclude.articles.include.article.include.author.select).toEqual(publicAuthorSelect);
  expect(topicInclude.discussions.include.discussion.include.author.select).toEqual(publicAuthorSelect);
  expect(discussionFindFirst.mock.calls[0][0].include.author.select).toEqual(publicAuthorSelect);
  expect(discussionFindFirst.mock.calls[0][0].include.comments.include.author.select).toEqual(publicAuthorSelect);
  expect(discussionFindFirst.mock.calls[0][0].include.comments.include.replies.include.author.select).toEqual(publicAuthorSelect);
  expect(articleFindMany.mock.calls[0][0].include.author.select).toEqual(publicAuthorSelect);
  expect(discussionFindMany.mock.calls[0][0].include.author.select).toEqual(publicAuthorSelect);
 });
});

describe('public content visibility',()=>{
 it('limits article and discussion detail lookups to published content',async()=>{
  const articleFindFirst=jest.fn().mockResolvedValue(null);const discussionFindFirst=jest.fn().mockResolvedValue(null);
  const db={article:{findFirst:articleFindFirst},client:{discussion:{findFirst:discussionFindFirst}}} as unknown as Db;
  await expect(new ArticlesController(db).one('draft-or-archived')).rejects.toBeInstanceOf(NotFoundException);
  await expect(new DiscussionsController(db).one('draft-or-archived')).rejects.toBeInstanceOf(NotFoundException);
  expect(articleFindFirst.mock.calls[0][0].where).toEqual({slug:'draft-or-archived',status:'PUBLISHED'});
  expect(discussionFindFirst.mock.calls[0][0].where).toEqual({slug:'draft-or-archived',status:'PUBLISHED'});
 });

 it('filters topic associations to published articles and discussions',async()=>{
  const findUnique=jest.fn().mockResolvedValue({});
  await new TopicsController({topic:{findUnique}} as unknown as Db).one('history');
  const include=findUnique.mock.calls[0][0].include;
  expect(include.articles.where).toEqual({article:{status:'PUBLISHED'}});
  expect(include.discussions.where).toEqual({discussion:{status:'PUBLISHED'}});
 });
});

describe('topic relation writes',()=>{
 it('deduplicates valid article topic IDs and keeps topicIds out of Prisma data',async()=>{
  const findMany=jest.fn().mockResolvedValue([{id:'topic-1'},{id:'topic-2'}]);const create=jest.fn().mockResolvedValue({id:'article-1'});
  const controller=new ArticlesController({topic:{findMany},article:{create}} as unknown as Db);
  await controller.create({user:{sub:'editor-1'}},{...articleInput,topicIds:['topic-1','topic-1','topic-2']} as any);
  const data=create.mock.calls[0][0].data;
  expect(findMany).toHaveBeenCalledWith({where:{id:{in:['topic-1','topic-2']}},select:{id:true}});
  expect(data.topics).toEqual({create:[{topicId:'topic-1'},{topicId:'topic-2'}]});
  expect(data).not.toHaveProperty('topicIds');
 });

 it('rejects article writes with missing topic IDs and permits an omitted topic list',async()=>{
  const findMany=jest.fn().mockResolvedValue([{id:'topic-1'}]);const create=jest.fn().mockResolvedValue({id:'article-1'});
  const controller=new ArticlesController({topic:{findMany},article:{create}} as unknown as Db);
  await expect(controller.create({user:{sub:'editor-1'}},{...articleInput,topicIds:['topic-1','missing']} as any)).rejects.toBeInstanceOf(NotFoundException);
  await controller.create({user:{sub:'editor-1'}},articleInput as any);
  expect(create.mock.calls[0][0].data).not.toHaveProperty('topics');
 });

 it('replaces article topic joins when an explicit topic list is supplied',async()=>{
  const findMany=jest.fn().mockResolvedValue([{id:'topic-2'}]);const findUnique=jest.fn().mockResolvedValue({authorId:'editor-1',publishedAt:null});const update=jest.fn().mockResolvedValue({id:'article-1'});
  const controller=new ArticlesController({topic:{findMany},article:{findUnique,update}} as unknown as Db);
  await controller.update({user:{sub:'editor-1',role:'EDITOR'}},'article-1',{...articleInput,topicIds:['topic-2','topic-2']} as any);
  expect(update.mock.calls[0][0].data.topics).toEqual({deleteMany:{},create:[{topicId:'topic-2'}]});
  expect(update.mock.calls[0][0].data).not.toHaveProperty('topicIds');
 });

 it('deduplicates valid discussion topics, rejects missing IDs, and supports no topics',async()=>{
  const findMany=jest.fn().mockResolvedValueOnce([{id:'topic-1'}]).mockResolvedValueOnce([]);const create=jest.fn().mockResolvedValue({id:'discussion-1'});
  const controller=new DiscussionsController({topic:{findMany},client:{discussion:{create}}} as unknown as Db);
  await controller.create({user:{sub:'member-1'}},{...discussionInput,topicIds:['topic-1','topic-1']} as any);
  expect(create.mock.calls[0][0].data.topics).toEqual({create:[{topicId:'topic-1'}]});
  expect(create.mock.calls[0][0].data).not.toHaveProperty('topicIds');
  await expect(controller.create({user:{sub:'member-1'}},{...discussionInput,topicIds:['missing']} as any)).rejects.toBeInstanceOf(NotFoundException);
  await controller.create({user:{sub:'member-1'}},discussionInput as any);
  expect(create.mock.calls[1][0].data).not.toHaveProperty('topics');
 });
});
