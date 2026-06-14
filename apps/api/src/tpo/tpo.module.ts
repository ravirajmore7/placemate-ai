import { Module } from "@nestjs/common";
import { TpoController } from "./tpo.controller";
import { TpoService } from "./tpo.service";

@Module({
  controllers: [TpoController],
  providers: [TpoService]
})
export class TpoModule {}
