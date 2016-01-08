/**
 * # Parse.js
 *
 * This class interfaces with Parse.com using the rest api
 * see [https://parse.com/docs/rest/guide](https://parse.com/docs/rest/guide)
 *
 */
'use string';

import CONFIG from './config';
import Parse from './Parse';
import Hapi from './Hapi';
import Firebase from './FirebaseBackend';

export default function BackendFactory(token = null) {
  if (CONFIG.backend.parse) {
    return new Parse(token);
  } else if (CONFIG.backend.hapiLocal || CONFIG.backend.hapiRemote) {
    return new Hapi(token);
  }else if(CONFIG.backend.firebase){
    return new Firebase(token);
  }
}
