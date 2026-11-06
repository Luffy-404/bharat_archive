import { ArticlesController, Db } from './api.module';
import { ForbiddenException } from '@nestjs/common';

const articleInput={title:'A valid article title',slug:'valid-article',summary:'A sufficiently long article summary for the validation contract.',content:'A sufficiently long article body that satisfies the configured minimum content length.'};
const editor={user:{sub:'editor-1',role:'EDITOR'}};

describe('article authoring',()=>{
 it('marks every authoring route as editor-only',()=>{
  for(const method of ['mine','edit','create','update'])expect(Reflect.getMetadata('roles',(ArticlesController.prototype as any)[method])).toEqual(['EDITOR','MODERATOR','ADMIN']);
 });

 it('creates only a draft with an initial revision and validated source data',async()=>{
  const create=jest.fn().mockResolvedValue({id:'article-1',status:'DRAFT'});
  const controller=new ArticlesController({article:{create}} as unknown as Db);
  await controller.create(editor,{...articleInput,sources:[{title:'A source title',url:'https://example.test/source',license:'CC BY',accessedAt:'2026-11-06'},{title:'Duplicate URL',url:'https://example.test/source'}]} as any);
  const data=create.mock.calls[0][0].data;
  expect(data.status).toBe('DRAFT');
  expect(data.revisions.create).toMatchObject({authorId:'editor-1',title:articleInput.title,content:articleInput.content,note:'Draft created'});
  expect(data.sources.create).toHaveLength(1);
  expect(data.sources.create[0]).toMatchObject({title:'A source title',url:'https://example.test/source',license:'CC BY'});
  await expect(controller.create(editor,{...articleInput,status:'PUBLISHED'} as any)).rejects.toBeInstanceOf(ForbiddenException);
 });

 it('allows an editor to load only their own draft and keeps revision history private from public reads',async()=>{
  const findUnique=jest.fn().mockResolvedValue({id:'article-1',authorId:'editor-1',topics:[],sources:[],revisions:[]});
  const controller=new ArticlesController({article:{findUnique}} as unknown as Db);
  await expect(controller.edit(editor,'article-1')).resolves.toMatchObject({id:'article-1'});
  await expect(controller.edit({user:{sub:'editor-2',role:'EDITOR'}},'article-1')).rejects.toBeInstanceOf(ForbiddenException);
  expect(findUnique.mock.calls[0][0].include.revisions).toBeDefined();
 });

 it('rejects editing another editor’s article or an already published article',async()=>{
  const findUnique=jest.fn().mockResolvedValueOnce({authorId:'editor-2',status:'DRAFT'}).mockResolvedValueOnce({authorId:'editor-1',status:'PUBLISHED'});
  const update=jest.fn();const controller=new ArticlesController({article:{findUnique,update}} as unknown as Db);
  await expect(controller.update(editor,'article-1',articleInput as any)).rejects.toBeInstanceOf(ForbiddenException);
  await expect(controller.update(editor,'article-1',articleInput as any)).rejects.toBeInstanceOf(ForbiddenException);
  expect(update).not.toHaveBeenCalled();
 });

 it('saves a revision and sources, then publishes a permitted draft',async()=>{
  const findUnique=jest.fn().mockResolvedValue({authorId:'editor-1',status:'DRAFT'});const update=jest.fn().mockResolvedValue({id:'article-1',status:'PUBLISHED'});
  const controller=new ArticlesController({article:{findUnique,update}} as unknown as Db);
  await controller.update(editor,'article-1',{...articleInput,status:'PUBLISHED',revisionNote:'Ready for readers',sources:[{title:'Primary source',url:'https://example.test/primary'}]} as any);
  const data=update.mock.calls[0][0].data;
  expect(data.status).toBe('PUBLISHED');
  expect(data.publishedAt).toBeInstanceOf(Date);
  expect(data.revisions.create).toMatchObject({authorId:'editor-1',note:'Ready for readers'});
  expect(data.sources).toEqual({deleteMany:{},create:[{title:'Primary source',url:'https://example.test/primary',license:null,accessedAt:null}]});
 });
});
