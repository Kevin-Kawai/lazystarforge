export class ForgeSession {
  constructor(public readonly id: string, private _status: "idle" | "running" = "idle") {}

  get status() {
    return this._status
  }

  start() {
    if (this.__status == "running") throw Error("Session already running")
    this._status = "running"
  }
}
