import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { DrivesModule } from "./drives/drives.module";
import { PrismaModule } from "./prisma/prisma.module";
import { Stage2Module } from "./stage2/stage2.module";
import { Stage3Module } from "./stage3/stage3.module";
import { StudentsModule } from "./students/students.module";
import { TpoModule } from "./tpo/tpo.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    DrivesModule,
    ApplicationsModule,
    Stage2Module,
    Stage3Module,
    TpoModule,
    AdminModule
  ]
})
export class AppModule {}
