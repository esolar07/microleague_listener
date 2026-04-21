import { SetMetadata } from "@nestjs/common";

export const MESSAGE_METADATA_KEY = "Message";
export const Message = (message: string) =>
  SetMetadata(MESSAGE_METADATA_KEY, message);
