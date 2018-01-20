window["js_observables"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Represents the State object.
 * @constructor
 * @param {object} data - The object value which is used to create the State object for making it observable
 * @property {object} listeners - Stores the event handlers for the above object for observable properties registered via "on" function
 * @property {object} next_listeners - Stores the event handlers for the above object for observable properties registered via "next" function. The difference with the above "listeners" is that for observables registered via "on", notifications will be sent out for every change. However for those registered via "next" the handlers will be called at the start of next event loop
 * @property {object} data - The object passed by user for making it observable
 * @property {boolean} locked - The locked property is used to chek whether the property has been locked for event notification
 * @property {object} locked_data - The data value at the time of lock
 * @property {object} changed_prop - The value of changed data oject while it is locked
 * @property {object}  lock_track_change - The properties old and changed values and a boolean tracker
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function State() {
  this.listeners = {};
  this.next_listeners = {};
  this.track_change = {};
  this.data = {};
  this.locked = false;
  this.locked_data;
  this.changed_prop = {};
  this.lock_track_change = {};
}

/** 
 * Clones the object 
 * @helper_function
 * @param {object} object - The data object to clone
 * @param {object} ret - The cloned data
*/
function getClone(object) {
  var ret = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  for (key in object) {
    if (_typeof(object[key]) == 'object') {
      ret[key] = getClone(object[key], ret);
    } else {
      ret[key] = object[key];
    }
  }
  return ret;
}

/** 
 * Initiates the process of getting the values by cloning the object
 * @helper_function
 * @param {object} object - The data object to clone
*/
function getValues(object) {
  if ((typeof object === 'undefined' ? 'undefined' : _typeof(object)) == 'object') {
    return getClone(object);
  } else return object;
}

/** 
 * Inserts new proprties in the object via recursively traversing the path 
 * @helper_function
 * @param {object} object - The data object 
 * @param {array} key_vals - Path represente by comma separated values
 * @param {object} value - Object to be inserted in the data object
*/
function recursiveInsert(object, key_vals, value) {
  if (key_vals.length == 1) {
    object[key_vals[0]] = value;
    return;
  }
  if (!(key_vals[0] in object && object.hasOwnProperty(key_vals[0]) && _typeof(object[key_vals[0]]) == "object")) {
    object[key_vals[0]] = {};
  }
  recursiveInsert(object[key_vals[0]], key_vals.slice(1), value);
}

/** 
 * Fetches proprties from the object via recursively traversing the path till key reached
 * @helper_function
 * @param {object} object - The data object 
 * @param {array} key_vals - Path represente by comma separated values
*/
function recursiveGet(object, key_vals) {
  if (key_vals.length == 1) {
    return getValues(object[key_vals[0]]);
  }
  if (key_vals[0] in object && object.hasOwnProperty(key_vals[0])) {
    return recursiveGet(object[key_vals[0]], key_vals.slice(1));
  }
}

/** 
 * Updates  proprties in the object via recursively traversing the path till key reached. If key not present then empty object created at key an data inserted.
 * @helper_function
 * @param {object} object - The data object 
 * @param {array} key_vals - Path represente by comma separated values
 * @param {object} value - Object to be updated in the data object
*/
function recursiveSet(object, key_vals, value) {
  if (key_vals.length == 1) {
    var oldVal = object[key_vals[0]];
    var newVal = value;
    object[key_vals[0]] = value;
    return;
  }
  if (!(key_vals[0] in object && object.hasOwnProperty(key_vals[0]) && _typeof(object[key_vals[0]]) == "object")) {
    object[key_vals[0]] = {};
  }
  recursiveSet(object[key_vals[0]], key_vals.slice(1), value);
}

/** 
 * Creates a State object from user defined object
 * @static_function
 * @param {object} data - The data object given by user
*/
State.create = function (data) {
  return new State(data);
};
State.prototype = {
  create: function create(key, value) {
    if (arguments.length === 2) {
      var key_vals = key.split('.');
      recursiveInsert(this.data, key_vals, value);
    } else if (arguments.length == 1) {
      for (var k in key) {
        this.data[k] = key[k];
      }
    }
  },
  getState: function getState() {
    return this.data;
  },
  lock: function lock() {
    this.locked = true;
    this.locked_data = this.getState();
    return this;
  },
  unlock: function unlock() {
    this.notify();
    this.locked = false;
    return this;
  },
  prop: function prop(key, newValue) {
    var key_vals = key.split('.');
    if (arguments.length == 2) {
      var oldVal = {};
      var newVal = {};
      if (this.locked) {
        for (l_key in this.listeners) {
          if (key.startsWith(l_key) && !(l_key in this.changed_prop)) {
            this.changed_prop[l_key] = recursiveGet(this.data, l_key.split("."));
          }
        }
        for (l_key in this.next_listeners) {
          if (key.startsWith(l_key)) {
            if (!this.lock_track_change[l_key]) {
              this.lock_track_change[l_key] = {};
              this.lock_track_change[l_key]['oldValue'] = recursiveGet(this.data, l_key.split("."));
            } else {
              this.lock_track_change[l_key]['changed'] = true;
            }
          }
        }
      } else {
        for (l_key in this.listeners) {
          oldVal[l_key] = recursiveGet(this.data, l_key.split("."));
        }
        for (l_key in this.next_listeners) {
          if (key.startsWith(l_key)) {
            if (!this.track_change[l_key]) {
              this.track_change[l_key] = {};
              this.track_change[l_key]['oldValue'] = recursiveGet(this.data, l_key.split("."));
            } else {
              this.track_change[l_key]['changed'] = true;
            }
          }
        }
      }
      recursiveSet(this.data, key_vals, newValue);
      if (!this.locked) this.notify(key, oldVal);
      return this;
    } else {
      return recursiveGet(this.data, key_vals);
    }
  },
  on: function on(key, listener) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(listener);
    var listener_index = this.listeners[key].indexOf(listener);
    var func = this.unsubscribe(this, key, listener_index, false);
    return func;
  },
  next: function next(key, listener) {
    if (!this.next_listeners[key]) this.next_listeners[key] = [];
    this.next_listeners[key].push(listener);
    var listener_index = this.next_listeners[key].indexOf(listener);
    var func = this.unsubscribe(this, key, listener_index, true);
    return func;
  },
  notify: function notify(key, oldValue) {
    var _this = this;

    if (this.locked) {
      for (l_key in this.changed_prop) {
        newValue = recursiveGet(this.data, l_key.split("."));
        oldValue = this.changed_prop[l_key];
        if (!this.listeners[l_key] || this.listeners[l_key].length < 1) return;
        this.listeners[l_key].forEach(function (listenerAction) {
          return listenerAction(oldValue, newValue);
        });
      }
      for (l_key in this.lock_track_change) {
        if (this.lock_track_change[l_key]['changed']) {
          newValue = recursiveGet(this.data, l_key.split("."));
          if (!this.next_listeners[l_key] || this.next_listeners[l_key].length < 1) return;
          this.next_listeners[l_key].forEach(function (listenerAction) {
            return listenerAction(_this.lock_track_change[l_key]['oldValue'], newValue);
          });
        }
      }
      this.changed_prop = {};
      this.lock_track_change = {};
    } else {
      for (l_key in oldValue) {
        if (key.startsWith(l_key)) {
          newValue = recursiveGet(this.data, l_key.split("."));
          if (!this.listeners[l_key] || this.listeners[l_key].length < 1) return;
          this.listeners[l_key].forEach(function (listenerAction) {
            return listenerAction(oldValue[l_key], newValue);
          });
        }
      }
      for (l_key in this.next_listeners) {
        if (this.track_change[l_key] && this.track_change[l_key]['changed']) {
          newValue = recursiveGet(this.data, l_key.split("."));
          if (!this.next_listeners[l_key] || this.next_listeners[l_key].length < 1) return;
          this.next_listeners[l_key].forEach(function (listenerAction) {
            return listenerAction(_this.track_change[l_key]['oldValue'], newValue);
          });
          delete this.track_change[l_key];
        }
      }
    }
  },
  unsubscribe: function unsubscribe(obj, key, index, next) {
    return function () {
      if (next) {
        if (key in obj.next_listeners) {
          obj.next_listeners[key].pop(index);
        }
      } else {
        if (key in obj.listeners) {
          obj.listeners[key].pop(index);
        }
      }
    };
  }
};

module.exports = function () {
  return new State();
};

/***/ })
/******/ ]);
//# sourceMappingURL=js_observables.js.map