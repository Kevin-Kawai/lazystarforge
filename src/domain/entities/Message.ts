export enum EMessenger {
  USER = "user",
  SYSTEM = "system"
}

export interface IMessage {
  messenger: EMessenger,
  content: String
}

export class Message implements IMessage {
  messenger: EMessenger
  content: String

  constructor({ messenger, content }: IMessage) {
    this.messenger = messenger
    this.content = content
  }
}
