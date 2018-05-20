import { NextFunction, Request, Response } from 'express';

class UsersController {
  /**
   * Gets the current logged in user (from token).
   *
   * @param {http.IncomingMessage} req - Client request
   * @param {http.ServerResponse} response - Response object
   * @param {function} next - next middleware
   */
  static getLoggedInUser(req: Request, response: Response, next: NextFunction) {
    response.json(req.user);
  }
}

export default UsersController;
