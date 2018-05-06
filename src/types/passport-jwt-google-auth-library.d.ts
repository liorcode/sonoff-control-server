/**
 * Based on the definition file for passport-jwt
 * @see {@link https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/passport-jwt}
 */
import { Strategy as PassportStrategy } from 'passport-strategy';
import { Request } from 'express';
import { TokenInfo } from 'google-auth-library/build/src/auth/oauth2client';

export declare class Strategy extends PassportStrategy {
  constructor(opt: StrategyOptions, verify: VerifyCallback);
  constructor(opt: StrategyOptions, verify: VerifyCallbackWithRequest);
}

export interface StrategyOptions {
  clientID: string;
  secretOrKey: string | Buffer;
  jwtFromRequest: JwtFromRequestFunction;
  passReqToCallback?: boolean;
}

export interface VerifyCallback {
  (payload: TokenInfo, done: VerifiedCallback): void;
}

export interface VerifyCallbackWithRequest {
  (req: Request, payload: TokenInfo, done: VerifiedCallback): void;
}

export interface VerifiedCallback {
  (error: any, user?: any, info?: any): void;
}

export interface JwtFromRequestFunction {
  (req: Request): string;
}

export declare namespace ExtractJwt {
  export function fromHeader(headerName: string): JwtFromRequestFunction;
  export function fromBodyField(fieldName: string): JwtFromRequestFunction;
  export function fromUrlQueryParameter(paramName: string): JwtFromRequestFunction;
  export function fromAuthHeaderWithScheme(authScheme: string): JwtFromRequestFunction;
  export function fromExtractors(extractors: JwtFromRequestFunction[]): JwtFromRequestFunction;
  export function fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
}
