import { Module } from '@nestjs/common'; import { ConfigModule } from '@nestjs/config'; import * as Joi from 'joi'; import { resolve } from 'path'; import { ApiModule } from './api.module';
export const environmentValidationSchema=Joi.object({NODE_ENV:Joi.string().valid('development','test','production').default('development'),JWT_SECRET:Joi.string().min(32).required()}).unknown(true);
@Module({imports:[ConfigModule.forRoot({isGlobal:true,envFilePath:resolve(__dirname,'../../../.env'),validationSchema:environmentValidationSchema}),ApiModule]}) export class AppModule {}
