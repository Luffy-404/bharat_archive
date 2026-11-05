import { environmentValidationSchema } from './app.module';

describe('environment validation',()=>{
 it('rejects a missing JWT secret in production',()=>{
  expect(environmentValidationSchema.validate({NODE_ENV:'production'}).error).toBeDefined();
 });
 it('rejects an undersized JWT secret and accepts a long explicit secret',()=>{
  expect(environmentValidationSchema.validate({JWT_SECRET:'too-short'}).error).toBeDefined();
  expect(environmentValidationSchema.validate({NODE_ENV:'development',JWT_SECRET:'development-secret-with-at-least-thirty-two-characters'}).error).toBeUndefined();
 });
});
