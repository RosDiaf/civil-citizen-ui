import express from 'express';
import helmet from 'helmet';
import nocache from 'nocache';

import { ContentSecurityPolicy } from './modules/contentSecurityPolicy';
import { ReferrerPolicy } from './modules/referredPolicy';
import { Config as HPKP, HttpPublicKeyPinning } from './modules/httpPublicKeyPinning';

export interface Config {
  referrerPolicy: string;
  hpkp: HPKP;
}

/**
 * Module that enables helmet for Express.js applications
 */
export class Helmet {

  constructor(public config: Config, public developmentMode: boolean) {
  }

  enableFor(app: express.Express) {
    app.use(helmet());
    app.use(helmet.hidePoweredBy());
    app.disable('x-powered-by');
    app.disabled('Server');
    app.use(/^\/(?!js|img|pdf|stylesheets).*$/, nocache());

    new ContentSecurityPolicy(this.developmentMode).enableFor(app);

    if (this.config.referrerPolicy) {
      new ReferrerPolicy(this.config.referrerPolicy).enableFor(app);
    }

    if (this.config.hpkp) {
      new HttpPublicKeyPinning(this.config.hpkp).enableFor(app);
    }
  }
}
