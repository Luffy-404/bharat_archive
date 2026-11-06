import { DiscussionsController, Db, publicAuthorSelect } from './api.module';
import { NotFoundException } from '@nestjs/common';

describe('community discussions',()=>{
 it('limits public detail queries to published discussions and bounded chronological replies',async()=>{
  const findFirst=jest.fn().mockResolvedValue(null);const controller=new DiscussionsController({discussion:{findFirst}} as unknown as Db);
  await expect(controller.one('private-discussion')).rejects.toBeInstanceOf(NotFoundException);
  const query=findFirst.mock.calls[0][0];
  expect(query.where).toEqual({slug:'private-discussion',status:'PUBLISHED'});
  expect(query.include.comments).toMatchObject({where:{parentId:null,hiddenAt:null},orderBy:{createdAt:'asc'},take:100});
  expect(query.include.comments.include.author.select).toEqual(publicAuthorSelect);
  expect(query.include.comments.include.replies).toMatchObject({where:{hiddenAt:null},orderBy:{createdAt:'asc'},take:100});
  expect(query.include.comments.include.replies.include.author.select).toEqual(publicAuthorSelect);
 });

 it('accepts replies only for a published discussion and a parent in that discussion',async()=>{
  const discussionFindFirst=jest.fn().mockResolvedValue({id:'discussion-1'});const commentFindFirst=jest.fn().mockResolvedValue({id:'parent-1'});const create=jest.fn().mockResolvedValue({id:'comment-1'});
  const controller=new DiscussionsController({discussion:{findFirst:discussionFindFirst},comment:{findFirst:commentFindFirst,create}} as unknown as Db);
  await controller.comment({user:{sub:'member-1'}},'discussion-1',{body:'A useful reply',parentId:'parent-1'} as any);
  expect(discussionFindFirst).toHaveBeenCalledWith({where:{id:'discussion-1',status:'PUBLISHED'},select:{id:true}});
  expect(commentFindFirst).toHaveBeenCalledWith({where:{id:'parent-1',discussionId:'discussion-1',hiddenAt:null},select:{id:true}});
  expect(create.mock.calls[0][0].data).toEqual({body:'A useful reply',parentId:'parent-1',discussionId:'discussion-1',authorId:'member-1'});
  expect(create.mock.calls[0][0].include.author.select).toEqual(publicAuthorSelect);
 });

 it('rejects replies to missing or unpublished discussions and invalid parents',async()=>{
  const missingDiscussion=new DiscussionsController({discussion:{findFirst:jest.fn().mockResolvedValue(null)},comment:{findFirst:jest.fn(),create:jest.fn()}} as unknown as Db);
  await expect(missingDiscussion.comment({user:{sub:'member-1'}},'missing',{body:'A useful reply'} as any)).rejects.toBeInstanceOf(NotFoundException);
  const missingParent=new DiscussionsController({discussion:{findFirst:jest.fn().mockResolvedValue({id:'discussion-1'})},comment:{findFirst:jest.fn().mockResolvedValue(null),create:jest.fn()}} as unknown as Db);
  await expect(missingParent.comment({user:{sub:'member-1'}},'discussion-1',{body:'A useful reply',parentId:'elsewhere'} as any)).rejects.toBeInstanceOf(NotFoundException);
 });
});
