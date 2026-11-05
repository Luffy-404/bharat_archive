import { Body, CanActivate, Controller, ExecutionContext, ForbiddenException, Get, Injectable, Module, NotFoundException, OnModuleDestroy, OnModuleInit, Param, Patch, Post, Query, Req, SetMetadata, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { compare, hash } from 'bcryptjs';
import { DiscussionKind, PrismaClient, PublicationStatus, Role } from '@prisma/client';

const ROLES='roles';
const Roles=(...roles:Role[])=>SetMetadata(ROLES,roles);
export const publicAuthorSelect={id:true,displayName:true} as const;

class RegisterDto {@IsEmail() email!:string; @Length(10,128) password!:string; @Length(2,80) displayName!:string}
class LoginDto {@IsEmail() email!:string; @IsString() password!:string}
class ArticleDto {@Length(3,180) title!:string; @Length(3,180) slug!:string; @Length(20,500) summary!:string; @Length(40,100000) content!:string; @IsOptional() @IsArray() @IsString({each:true}) topicIds?:string[]; @IsOptional() @IsEnum(PublicationStatus) status?:PublicationStatus}
class DiscussionDto {@Length(3,180) title!:string; @Length(3,180) slug!:string; @Length(10,20000) body!:string; @IsOptional() @IsEnum(DiscussionKind) kind?:DiscussionKind; @IsOptional() @IsArray() @IsString({each:true}) topicIds?:string[]}
class CommentDto {@Length(2,10000) body!:string; @IsOptional() parentId?:string}
class ReportDto {@Length(5,1000) reason!:string; @IsOptional() articleId?:string}
class SettingsDto {@Length(2,80) displayName!:string; @IsOptional() @Matches(/^[a-z0-9-]{3,30}$/) username?:string; @IsOptional() @Length(0,280) bio?:string}

@Injectable()
export class Db extends PrismaClient implements OnModuleInit, OnModuleDestroy {
 async onModuleInit(){const delegates=['user','article','topic'] as const;for(const delegate of delegates){if(!this[delegate])throw new Error(`Prisma client is missing the ${delegate} delegate. Run pnpm db:generate from the repository root.`)}await this.$connect()}
 async onModuleDestroy(){await this.$disconnect()}
 get client(){return this}
}

@Injectable()
class JwtGuard implements CanActivate {
 constructor(private jwt:JwtService){}
 canActivate(c:ExecutionContext){const token=c.switchToHttp().getRequest().headers.authorization?.replace('Bearer ','');if(!token)throw new UnauthorizedException();try{c.switchToHttp().getRequest().user=this.jwt.verify(token);return true}catch{throw new UnauthorizedException()}}
}

@Injectable()
class RolesGuard implements CanActivate {
 canActivate(c:ExecutionContext){const roles=Reflect.getMetadata(ROLES,c.getHandler()) as Role[]|undefined;if(!roles)return true;const u=c.switchToHttp().getRequest().user;if(!u||!roles.includes(u.role))throw new ForbiddenException();return true}
}

async function topicConnect(db:Db,topicIds?:string[]){
 if(topicIds===undefined)return undefined;
 const ids=[...new Set(topicIds)];
 const topics=await db.topic.findMany({where:{id:{in:ids}},select:{id:true}});
 if(topics.length!==ids.length)throw new NotFoundException('One or more topics were not found');
 return ids.map(id=>({id}));
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
 constructor(private db:Db,private jwt:JwtService){}
 @Post('register') async register(@Body()d:RegisterDto){const exists=await this.db.user.findUnique({where:{email:d.email}});if(exists)throw new ForbiddenException('Email is already registered');const u=await this.db.user.create({data:{email:d.email,passwordHash:await hash(d.password,12),displayName:d.displayName}});return this.token(u)}
 @Post('login') async login(@Body()d:LoginDto){const u=await this.db.user.findUnique({where:{email:d.email}});if(!u||!(await compare(d.password,u.passwordHash)))throw new UnauthorizedException('Invalid email or password');return this.token(u)}
 private token(u:{id:string;email:string;role:Role;displayName:string}){return {accessToken:this.jwt.sign({sub:u.id,email:u.email,role:u.role}),user:{id:u.id,email:u.email,role:u.role,displayName:u.displayName}}}
}

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
 constructor(private db:Db){}
 @Get() list(){return this.db.topic.findMany({include:{children:true,parent:true},orderBy:{name:'asc'}})}
 @Get(':slug') async one(@Param('slug')slug:string){const t=await this.db.topic.findUnique({where:{slug},include:{parent:true,children:true,articles:{where:{article:{status:PublicationStatus.PUBLISHED}},include:{article:{include:{author:{select:publicAuthorSelect}}}}},discussions:{where:{discussion:{status:PublicationStatus.PUBLISHED}},include:{discussion:{include:{author:{select:publicAuthorSelect}}}}}}});if(!t)throw new NotFoundException();return t}
}

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
 constructor(private db:Db){}
 @Get() list(@Query('page')page='1'){return this.db.article.findMany({where:{status:PublicationStatus.PUBLISHED},include:{author:{select:publicAuthorSelect},topics:{include:{topic:true}}},take:15,skip:(Number(page)-1)*15,orderBy:{publishedAt:'desc'}})}
 @Get(':slug') async one(@Param('slug')slug:string){const a=await this.db.article.findFirst({where:{slug,status:PublicationStatus.PUBLISHED},include:{author:{select:publicAuthorSelect},topics:{include:{topic:true}},sources:true,revisions:{include:{author:{select:publicAuthorSelect}},orderBy:{createdAt:'desc'}}}});if(!a)throw new NotFoundException();return a}
 @UseGuards(JwtGuard,RolesGuard)
 @Roles(Role.EDITOR,Role.MODERATOR,Role.ADMIN)
 @Post() async create(@Req()r:any,@Body()d:ArticleDto){const {topicIds,...article}=d;const connect=await topicConnect(this.db,topicIds);return this.db.article.create({data:{...article,author:{connect:{id:r.user.sub}},status:d.status||PublicationStatus.DRAFT,publishedAt:d.status===PublicationStatus.PUBLISHED?new Date():undefined,...(connect?{topics:{create:connect.map(topic=>({topicId:topic.id}))}}:{})},include:{topics:true}})}
 @UseGuards(JwtGuard)
 @Patch(':id') async update(@Req()r:any,@Param('id')id:string,@Body()d:ArticleDto){const a=await this.db.article.findUnique({where:{id}});if(!a)throw new NotFoundException();if(a.authorId!==r.user.sub&&!['EDITOR','MODERATOR','ADMIN'].includes(r.user.role))throw new ForbiddenException();const {topicIds,...article}=d;const connect=await topicConnect(this.db,topicIds);return this.db.article.update({where:{id},data:{...article,...(connect?{topics:{deleteMany:{},create:connect.map(topic=>({topicId:topic.id}))}}:{}),publishedAt:d.status===PublicationStatus.PUBLISHED&&!a.publishedAt?new Date():a.publishedAt}})}
}

@ApiTags('discussions')
@Controller('discussions')
export class DiscussionsController {
 constructor(private db:Db){}
 @Get() list(@Query('kind')kind?:DiscussionKind){return this.db.client.discussion.findMany({where:{status:PublicationStatus.PUBLISHED,...(kind?{kind}:{})},include:{author:{select:publicAuthorSelect},topics:{include:{topic:true}},_count:{select:{comments:true}}},orderBy:{createdAt:'desc'},take:30})}
 @Get(':slug') async one(@Param('slug')slug:string){const d=await this.db.client.discussion.findFirst({where:{slug,status:PublicationStatus.PUBLISHED},include:{author:{select:publicAuthorSelect},topics:{include:{topic:true}},comments:{where:{parentId:null},include:{author:{select:publicAuthorSelect},replies:{include:{author:{select:publicAuthorSelect}}}},orderBy:{createdAt:'asc'}}}});if(!d)throw new NotFoundException();return d}
 @UseGuards(JwtGuard)
 @Post() async create(@Req()r:any,@Body()d:DiscussionDto){const {topicIds,...discussion}=d;const connect=await topicConnect(this.db,topicIds);return this.db.client.discussion.create({data:{...discussion,author:{connect:{id:r.user.sub}},...(connect?{topics:{create:connect.map(topic=>({topicId:topic.id}))}}:{})}})}
 @UseGuards(JwtGuard)
 @Post(':id/comments') comment(@Req()r:any,@Param('id')discussionId:string,@Body()d:CommentDto){return this.db.client.comment.create({data:{...d,discussionId,authorId:r.user.sub}})}
}

@ApiTags('search')
@Controller('search')
export class SearchController {
 constructor(private db:Db){}
 @Get() async search(@Query('q')q='',@Query('page')page='1'){if(q.trim().length<2)return {articles:[],topics:[],discussions:[],page:Number(page)};const term={contains:q,mode:'insensitive' as const};const [articles,topics,discussions]=await Promise.all([this.db.client.article.findMany({where:{status:PublicationStatus.PUBLISHED,OR:[{title:term},{summary:term},{content:term}]},take:10,skip:(Number(page)-1)*10,include:{author:{select:publicAuthorSelect}}}),this.db.client.topic.findMany({where:{OR:[{name:term},{description:term}]},take:10}),this.db.client.discussion.findMany({where:{status:PublicationStatus.PUBLISHED,OR:[{title:term},{body:term}]},take:10,include:{author:{select:publicAuthorSelect}}})]);return {articles,topics,discussions,page:Number(page)}}
}

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {constructor(private db:Db){} @Get(':id') async one(@Param('id')id:string){const u=await this.db.client.user.findUnique({where:{id},select:{id:true,displayName:true,bio:true,createdAt:true,articles:{where:{status:PublicationStatus.PUBLISHED},select:{slug:true,title:true,summary:true}}}});if(!u)throw new NotFoundException();return u}}

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('moderation')
export class ModerationController {constructor(private db:Db){} @Post('reports') report(@Req()r:any,@Body()d:ReportDto){return this.db.client.moderationReport.create({data:{...d,reporterId:r.user.sub}})} @UseGuards(RolesGuard) @Roles(Role.MODERATOR,Role.ADMIN) @Get('reports') reports(){return this.db.client.moderationReport.findMany({include:{reporter:{select:publicAuthorSelect},article:{select:{id:true,slug:true,title:true,status:true}}},orderBy:{createdAt:'desc'}})}}

@ApiTags('health')
@Controller('health')
export class HealthController {constructor(private db:Db){} @Get() async check(){await this.db.$queryRaw`SELECT 1`;return {status:'ok',database:'ok'}}}

@ApiTags('account')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('account')
export class AccountController {
 constructor(private db:Db){}
 @Get('me') me(@Req()r:any){return this.db.user.findUnique({where:{id:r.user.sub},select:{id:true,email:true,displayName:true,username:true,bio:true,createdAt:true}})}
 @Patch('settings') async settings(@Req()r:any,@Body()d:SettingsDto){try{return await this.db.user.update({where:{id:r.user.sub},data:{displayName:d.displayName,username:d.username||null,bio:d.bio||null},select:{id:true,email:true,displayName:true,username:true,bio:true,createdAt:true}})}catch{throw new ForbiddenException('That username is unavailable')}}
 @Get('articles') articles(@Req()r:any){return this.db.article.findMany({where:{authorId:r.user.sub},orderBy:{updatedAt:'desc'},select:{id:true,slug:true,title:true,summary:true,status:true,updatedAt:true,publishedAt:true}})}
 @Get('saved') saved(@Req()r:any){return this.db.savedArticle.findMany({where:{userId:r.user.sub},orderBy:{createdAt:'desc'},include:{article:{include:{author:{select:publicAuthorSelect},topics:{include:{topic:true}}}}}})}
 @Post('saved/:articleId') async save(@Req()r:any,@Param('articleId')articleId:string){const article=await this.db.article.findFirst({where:{id:articleId,status:PublicationStatus.PUBLISHED}});if(!article)throw new NotFoundException();return this.db.savedArticle.upsert({where:{userId_articleId:{userId:r.user.sub,articleId}},create:{userId:r.user.sub,articleId},update:{}})}
 @Patch('saved/:articleId') async unsave(@Req()r:any,@Param('articleId')articleId:string){await this.db.savedArticle.deleteMany({where:{userId:r.user.sub,articleId}});return {saved:false}}
}

@Module({imports:[ConfigModule,JwtModule.registerAsync({imports:[ConfigModule],inject:[ConfigService],useFactory:(config:ConfigService)=>({secret:config.getOrThrow<string>('JWT_SECRET'),signOptions:{expiresIn:'8h'}})})],controllers:[AuthController,TopicsController,ArticlesController,DiscussionsController,SearchController,ProfilesController,ModerationController,HealthController,AccountController],providers:[Db,JwtGuard,RolesGuard],exports:[Db]})
export class ApiModule {}
