export interface IProject {
  name: string
  path: string
}

export class Project implements IProject {
  name: string
  path: string

  constructor(path: string, name: string) {
    this.path = path
    this.name = name
  }
}
