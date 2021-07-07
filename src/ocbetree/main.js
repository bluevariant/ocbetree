let ocbetreeInstance;

class Ocbetree {
  constructor() {
    this.context = {
      repository: undefined,
    };
  }

  assign(context = {}) {
    this.context = Object.assign(this.context, context);

    console.log(this.context);

    return this;
  }

  static invoke() {
    if (!ocbetreeInstance) {
      ocbetreeInstance = new Ocbetree();
    }

    return ocbetreeInstance;
  }
}
