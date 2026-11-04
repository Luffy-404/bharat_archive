import { Module } from '@nestjs/common'; import { ConfigModule } from '@nestjs/config'; import { resolve } from 'path'; import { ApiModule } from './api.module';
@Module({imports:[ConfigModule.forRoot({isGlobal:true,envFilePath:resolve(__dirname,'../../../.env')}),ApiModule]}) export class AppModule {}
