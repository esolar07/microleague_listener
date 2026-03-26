import { forwardRef, Module } from "@nestjs/common";
import { MongoModule } from "./mongo.module";
import { DatabaseModule } from "./database.module";
import { QueueModule } from "./queue.module";

@Module({
  imports: [MongoModule, DatabaseModule, QueueModule],
  exports: [MongoModule, DatabaseModule, QueueModule],
  providers: [],
})
export class CommonModule {}
