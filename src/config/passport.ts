import passport from 'passport';
import GoogleVerifyTokenStrategy from '../lib/passport-google-strategy';
import User, { IUserModel } from '../models/user.model';
import conf from './config';

const config = () => {
  /**
   * Use our custom strategy: verify Google's bearer token and set corresponding user.
   * If user is not found, create it.
   */
  passport.use(new GoogleVerifyTokenStrategy({
    clientID: conf.GOOGLE_CLIENT_ID,
  }, (payload, done) => {
    User.findOne({ googleId: payload.sub }, (err: Error, user: IUserModel) => {
      if (err) {
        return done(err, false);
      }
      if (user) { // User found
        return done(null, user);
      }

      // Else: user does not exist. create and return
      const newUser = new User({
        googleId: payload.sub,
        email: payload.email,
      });
      newUser.save((err) => {
        if (err) { // create failed
          return done(err, false);
        }
        // success
        return done(null, newUser);
      });
    });
  }));
};

export default config;
