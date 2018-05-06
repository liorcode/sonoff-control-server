/**
 * Custom strategy to authenticate a Google bearer token.
 * By default, it expects the token to be presented in an "Authorization" header, with "bearer" scheme.
 * E.g. "Authorization: Bearer eyJvbGciAiJSUzI2..."
 *
 * It uses google's auth library to validate the token and fetch the details of the users it belongs to.
 * It then places this user in the request object.
 */
import { Request } from 'express';
import { OAuth2Client as GoogleAuth2Client } from 'google-auth-library';
import passport from 'passport';

export interface tokenFromRequestFunction {
  (req: Request): string;
}

export interface VerifyCallback {
  (payload: any, done: VerifiedCallback): void;
}

export interface VerifiedCallback {
  (error: any, user?: any, info?: any): void;
}

export interface StrategyOptions {
  clientID: string;
  tokenFromRequest?: tokenFromRequestFunction;
}

class GoogleVerifyTokenStrategy extends passport.Strategy {
  name = 'google-verify-token';

  constructor(readonly strategyOptions: StrategyOptions, readonly verify: VerifyCallback) {
    super();
    if (!strategyOptions.tokenFromRequest) { // if no custom method was passed, use default
      strategyOptions.tokenFromRequest = GoogleVerifyTokenStrategy.getTokenFromHeader;
    }
  }

  authenticate(req: Request, options?: any) {
    const token = this.strategyOptions.tokenFromRequest(req);

    if (!token) {
      return this.fail('No auth token');
    }

    const doneCallback = (err: any, user?: any, info?: any) => {
      if (err) {
        return this.error(err);
      }
      if (!user) {
        return this.fail(info);
      }
      return this.success(user, info);
    };

    const googleAuth2Client = new GoogleAuth2Client(this.strategyOptions.clientID);
    googleAuth2Client.verifyIdToken({
      idToken: token,
      audience: this.strategyOptions.clientID,
    }).then((login) => {
      const payload = login.getPayload();
      this.verify(payload, doneCallback);
    })
    .catch(err => this.fail(err.message)); // fail expects a string, so just pass message
  }

  static getTokenFromHeader = (request: Request) => {
    const authScheme = 'bearer';
    let token = null;

    if (typeof request.headers.authorization === 'string') {
      const matches = request.headers.authorization.match(/(\S+)\s+(\S+)/);
      const authParams = matches && { scheme: matches[1], value: matches[2] };
      if (authParams && authParams.scheme.toLowerCase() === authScheme) {
        token = authParams.value;
      }
    }
    return token;
  }
}

export default GoogleVerifyTokenStrategy;

