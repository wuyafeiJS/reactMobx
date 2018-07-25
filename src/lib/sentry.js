import Raven from 'raven-js';
import config from 'config';

Raven.config(config.sentry, {
  release: process.env.SENTRY_RELEASE
}).install();

export default Raven;
