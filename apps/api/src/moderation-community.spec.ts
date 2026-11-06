import { ConflictException, NotFoundException } from '@nestjs/common';
import { ModerationController, Db } from './api.module';
import { ModerationAction, ReportStatus } from '@prisma/client';

describe('community moderation',()=>{
 it('creates a discussion report only when no active report by that member exists',async()=>{
  const discussion={findFirst:jest.fn().mockResolvedValue({id:'discussion-1'})};const moderationReport={findFirst:jest.fn().mockResolvedValue(null),create:jest.fn().mockResolvedValue({id:'report-1'})};const controller=new ModerationController({discussion,moderationReport} as unknown as Db);
  await controller.report({user:{sub:'member-1'}},{discussionId:'discussion-1',reason:'This needs review'} as any);
  expect(moderationReport.create.mock.calls[0][0].data).toMatchObject({discussionId:'discussion-1',reporterId:'member-1'});
  moderationReport.findFirst.mockResolvedValueOnce({id:'report-1'});
  await expect(controller.report({user:{sub:'member-1'}},{discussionId:'discussion-1',reason:'This needs review'} as any)).rejects.toBeInstanceOf(ConflictException);
 });

 it('rejects missing, hidden, or ambiguously targeted content',async()=>{
  const controller=new ModerationController({discussion:{findFirst:jest.fn().mockResolvedValue(null)},moderationReport:{findFirst:jest.fn(),create:jest.fn()}} as unknown as Db);
  await expect(controller.report({user:{sub:'member-1'}},{discussionId:'missing',reason:'This needs review'} as any)).rejects.toBeInstanceOf(NotFoundException);
  await expect(controller.report({user:{sub:'member-1'}},{discussionId:'one',commentId:'two',reason:'This needs review'} as any)).rejects.toThrow('exactly one');
 });

 it('dismisses a report and records the moderator audit event',async()=>{
  const findUnique=jest.fn().mockResolvedValue({id:'report-1',status:ReportStatus.OPEN});const update=jest.fn();const auditCreate=jest.fn();const result={id:'report-1',status:ReportStatus.DISMISSED};const controller=new ModerationController({moderationReport:{findUnique,update},$transaction:async(fn:any)=>fn({moderationReport:{update,findUnique:jest.fn().mockResolvedValue(result)},moderationAudit:{create:auditCreate}})} as unknown as Db);
  await expect(controller.dismiss({user:{sub:'moderator-1'}},'report-1')).resolves.toEqual(result);
  expect(update).toHaveBeenCalledWith({where:{id:'report-1'},data:{status:ReportStatus.DISMISSED}});
  expect(auditCreate).toHaveBeenCalledWith({data:{reportId:'report-1',actorId:'moderator-1',action:ModerationAction.REPORT_DISMISSED}});
 });

 it('hides a reported comment, actions active reports, and records the audit event',async()=>{
  const report={id:'report-1',status:ReportStatus.OPEN,articleId:null,discussionId:null,commentId:'comment-1'};const update=jest.fn();const updateMany=jest.fn();const auditCreate=jest.fn();const controller=new ModerationController({moderationReport:{findUnique:jest.fn().mockResolvedValue(report)},$transaction:async(fn:any)=>fn({comment:{update},moderationReport:{updateMany,findUnique:jest.fn().mockResolvedValue({id:'report-1',status:ReportStatus.ACTIONED})},moderationAudit:{create:auditCreate}})} as unknown as Db);
  await controller.hide({user:{sub:'moderator-1'}},'report-1');
  expect(update.mock.calls[0][0]).toMatchObject({where:{id:'comment-1'},data:{hiddenAt:expect.any(Date)}});
  expect(updateMany).toHaveBeenCalledWith({where:{commentId:'comment-1',status:{in:[ReportStatus.OPEN,ReportStatus.REVIEWED]}},data:{status:ReportStatus.ACTIONED}});
  expect(auditCreate).toHaveBeenCalledWith({data:{reportId:'report-1',actorId:'moderator-1',action:ModerationAction.CONTENT_HIDDEN}});
 });
});
