// @ts-ignore
type ICodeceptCallback = (i: CodeceptJS.I, ...steps: any) => void;

declare const actor: () => CodeceptJS.I;
declare const Feature: (string: string) => void;
declare const Scenario: (string: string, callback: ICodeceptCallback) => void;
declare const xScenario: (string: string, callback: ICodeceptCallback) => void;
declare const Before: (callback: ICodeceptCallback) => void;
declare const After: (callback: ICodeceptCallback) => void;
declare const within: (selector: string, callback: Function) => void;

declare namespace CodeceptJS {
  export interface I {
    amOnPage: (amOnPage) => any;
    click: (click) => any;
    fillField: (locator: string | object, value: string) => any;
    // @ts-ignore
    see: (text, context=any) => any;
    waitForText: (waitForText) => any;
  }
}

declare module "codeceptjs" {
  export = CodeceptJS;
}
