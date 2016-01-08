
import Firebase from 'firebase';
import CONFIG from './config';
import _ from 'underscore';
import Backend from './Backend';

export default class FirebaseBackend extends Backend{

  /**
   * ## Firebase
   *
   * constructor sets the default keys required by Firebase
   * if a user is logged in, we'll need the sessionToken
   *
   * @throws tokenMissing if token is undefined
   */
  constructor(token) {
    super(token);
    if (!_.isNull(token) && _.isUndefined(token.sessionToken)) {
      throw 'TokenMissing';
    }
    this._profile = _.isNull(token) ?  null :  token.sessionToken;
    this._sessionToken = _.isNull(token) ?  null :  token.sessionToken.sessionToken;
    this._applicationId = CONFIG.FIREBASE.APP_NAME;
    this.refUrl= 'https://' + this._applicationId + '.firebaseio.com';
    this.firebaseRef = new Firebase(this.refUrl);
  }
  /**
   * ### signup
   *
   * @param data object
   *
   * {username: "barton", email: "foo@gmail.com", password: "Passw0rd!"}
   *
   * @return
   * if ok, {createdAt: "2015-12-30T15:17:05.379Z",
   *   objectId: "5TgExo2wBA",
   *   sessionToken: "r:dEgdUkcs2ydMV9Y9mt8HcBrDM"}
   *
   * if error, {code: xxx, error: 'message'}
   */
  signup(data) {
    return new Promise((resolve, reject) => {
      this.firebaseRef.createUser({
        email: data.email,
        password: data.password
      }, function (error, userData) {
        if(error){
          reject(error);
        }else{
          resolve(userData);
        }
      });
    })
    .then((userData) => {
      return this.login(data);
    })
    .then((userData) => {
      return this.updateProfile(userData.objectId, {
        username: data.username
      }).then(function () {
        return userData;
      })
    });
  }
  /**
   * ### login
   * encode the data and and call _fetch
   *
   * @param data
   *
   *  {username: "barton", password: "Passw0rd!"}
   *
   * @returns
   *
   * createdAt: "2015-12-30T15:29:36.611Z"
   * email: "barton@foo.com"
   * objectId: "Z4yvP19OeL"
   * sessionToken: "r:Kt9wXIBWD0dNijNIq2u5rRllW"
   * updatedAt: "2015-12-30T16:08:50.419Z"
   * username: "barton"
   *
   */
  login(data) {
    return new Promise((resolve, reject) => {
      this.firebaseRef.authWithPassword({
        email: data.email,
        password: data.password
      }, function (error, userData) {
        if(error){
          reject(error);
        }else{
          resolve(this._assembleSessionToken(userData));
        }
      }.bind(this));
    });
  }

  _assembleSessionToken(userData){
    return {
      email: userData.password.email,
      objectId: userData.uid,
      sessionToken: userData.token,
      username: ""
    };
  }
  /**
   * ### logout
   * prepare the request and call _fetch
   */
  async logout() {
    return new Promise((resolve) => {
      this.firebaseRef.unauth();
      resolve();
    });
  }
  /**
   * ### resetPassword
   * the data is already in a JSON format, so call _fetch
   *
   * @param data
   * {email: "barton@foo.com"}
   *
   * @returns empty object
   *
   * if error:  {code: xxx, error: 'message'}
   */
  async resetPassword(data) {
    return new Promise((resolve, reject) => {
      this.firebaseRef.resetPassword({
        email: data.email
      }, (error) => {
        if(error){
          reject(error);
        }else{
          resolve();
        }
      })
    });
  }
  /**
   * ### getProfile
   * Using the sessionToken, we'll get everything about
   * the current user.
   *
   * @returns
   *
   * if good:
   * {createdAt: "2015-12-30T15:29:36.611Z"
   *  email: "barton@acclivyx.com"
   *  objectId: "Z4yvP19OeL"
   *  sessionToken: "r:uFeYONgIsZMPyxOWVJ6VqJGqv"
   *  updatedAt: "2015-12-30T15:29:36.611Z"
   *  username: "barton"}
   *
   * if error, {code: xxx, error: 'message'}
   */
  async getProfile() {
    return new Promise((resolve, reject) => {
      if(this._profile != null){
        this.firebaseRef.root().child('profiles/profile').child(this._profile.objectId).once('value', function (profileDataSnapshot) {
          var profile = Object.assign(this._profile, profileDataSnapshot.val());
          resolve(profile);
        }.bind(this), function (err) {
          reject(err);
        });
      }else{
        reject('Not logged in');
      }
    });
  }

  /**
   * ### updateProfile
   * for this user, update their record
   * the data is already in JSON format
   *
   * @param userId  _id of Parse.com
   * @param data object:
   * {username: "barton", email: "barton@foo.com"}
   */
  async updateProfile(userId, data) {
    return new Promise((resolve, reject) => {
      this.firebaseRef.root().child('profiles/profile').child(userId).child('username').set(data.username, function (error) {
        if(error){
          reject(error);
        }else{
          resolve();
        }
      })
    });
  }
}
