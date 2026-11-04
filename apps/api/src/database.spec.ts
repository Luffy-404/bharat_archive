import { AuthController, Db, HealthController } from './api.module';

describe('database provider',()=>{
  it('exposes the generated Prisma delegates used by auth, topics, and articles',async()=>{
    const db=new Db();
    expect(db.user).toBeDefined();
    expect(db.topic).toBeDefined();
    expect(db.article).toBeDefined();
    await db.$disconnect();
  });
  it('reports database health only after a successful query',async()=>{
    const query=jest.fn().mockResolvedValue([{ok:1}]);
    const controller=new HealthController({$queryRaw:query} as unknown as Db);
    await expect(controller.check()).resolves.toEqual({status:'ok',database:'ok'});
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('registers through the injected user delegate',async()=>{
    const findUnique=jest.fn().mockResolvedValue(null);
    const create=jest.fn().mockResolvedValue({id:'u1',email:'new@example.test',displayName:'New user',role:'MEMBER'});
    const jwt={sign:jest.fn().mockReturnValue('test-token')};
    const controller=new AuthController({user:{findUnique,create}} as unknown as Db,jwt as any);
    await expect(controller.register({email:'new@example.test',password:'long-enough-password',displayName:'New user'})).resolves.toMatchObject({accessToken:'test-token',user:{id:'u1'}});
    expect(findUnique).toHaveBeenCalledWith({where:{email:'new@example.test'}});
    expect(create).toHaveBeenCalledTimes(1);
  });
});
