export class FormGroup {
  // public controls?: FormControl[];
  defaultFormValue = null;

  constructor(public form: any) {
    this.dumbFormValue(form);
  }

  private dumbFormValue(form: any) {
    debugger;
    this.defaultFormValue = form;
  }

  reset() {
    this.form.controls.for;
  }
}

export class FormControl {
  constructor() {}
  writeValue() {}
  onChange() {}
  onBlur() {}
  onDisable() {}
}
