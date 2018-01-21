"use strict"

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
function State(data){
  this.listeners = {};
  this.next_listeners = {};
  this.track_change = {};
  this.data = data;
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
function getClone(object, ret={}) {
  var key;
	for (key in object) {
		if (typeof(object[key]) == 'object') {
			ret[key] = getClone(object[key], ret)
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
	if (typeof(object) == 'object') {
		return getClone(object);
	} else
		return object;
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
		object[key_vals[0]]= value;
		return;
	}
	if (!(key_vals[0] in object && object.hasOwnProperty(key_vals[0]) && typeof object[key_vals[0]] == "object"))
	{
    	object[key_vals[0]] = {};
    }
    recursiveInsert(object[key_vals[0]],key_vals.slice(1), value );
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
	if (key_vals[0] in object && object.hasOwnProperty(key_vals[0]))
	{
    	return recursiveGet(object[key_vals[0]],key_vals.slice(1));
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
		object[key_vals[0]]= value;
		return;
	}
	if (!(key_vals[0] in object && object.hasOwnProperty(key_vals[0]) && typeof object[key_vals[0]] == "object"))
	{
    	object[key_vals[0]] = {};
    }
    recursiveSet(object[key_vals[0]],key_vals.slice(1), value );
}

/** 
 * Creates a State object from user defined object
 * @static_function
 * @param {object} data - The data object given by user
*/
State.create = function(data){
	return new State(data);
}
State.prototype = {
  /** 
   * Appends property in the existing state (mutates the original state). The is called using two parameters. The first parameter is where to append the state and the second being what property to append. The same function can be called with only one parameter, just by passing the new state properties. In this case it appends the property in the base.
   * @prototype function
   * @param {string} key - Property name or path
   * @param {object} value - Value of the property to be added
  */
	create: function(key, value){
		if(arguments.length === 2){
			var key_vals = key.split('.');
			recursiveInsert(this.data, key_vals, value);
		}else if(arguments.length == 1){
			for(var k in key){
			    this.data[k] = key[k];
			}
		}
	},
  /** 
   * Returns the javascript object back
   * @prototype function
  */
	getState: function(){
		return this.data;
	},
  /** 
   * This helps control the call of handler when a property is changed. Once lock() is called the state caches all the change that comes after this. Returns the locked object.
   * @prototype function
  */
	lock: function(){
		this.locked = true;
		this.locked_data = this.getState();
		return this;
	},
  /** 
   * This helps control the call of handler when a property is changed. Once lock() is called the state caches all the change that comes after this. When unlock() is called it applies all the changes to the state and the handler is called. Returns the unlocked object.
   * @prototype function
  */
	unlock: function() {
		this.notify();
		this.locked = false;
		return this;
	},
  /** 
   * This acts as getter and setter. If the function is called by passing only one argument, it retrieve the value associated with the property. If the same function is called using two parameters, first one being the property and second one being the value, then the value is set for the property and the handlers are called(if any) which got registered using the on function
   * @prototype function
   * @param {string} key - Property name or path
   * @param {object} value - Value of the property to be added
  */
  prop: function(key, newValue){
    var key_vals = key.split('.');
    if (arguments.length == 2){
    	var oldVal = {}; 
    	var newVal = {};
      var l_key;
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
      if (!this.locked)
      	this.notify(key, oldVal);
      return this;
    }
    else{
    	return recursiveGet(this.data, key_vals);
    }
  },
  /** 
   * This function takes a single property and handler which is called when any of the properties are changed. When a single property is changed the handler is called with two parameter, what was the old value of the state property and what is the new value. If a handler is registered on change of a property which has another state property as value, then the handler gets called whenever any state property connected to it gets changed. The on returns a function which is when called the listener registered gets unregistered
   * @prototype function
   * @param {string} key - Property name or path
   * @param {function} listener - Event handler to be called when the property value changes
  */
  on: function(key, listener) {
    if(!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(listener);
	var listener_index = this.listeners[key].indexOf(listener);
	var func = this.unsubscribe(this, key, listener_index, false);
	return func;
  },
  /** 
   * This function calls the handlers at the start of next event loop (next frame call) with all updates happened in the current frame in single go. 
   * @prototype function
   * @param {string} key - Property name or path
   * @param {function} listener - Event handler to be called when the property value changes
  */
  next: function(key, listener){
  	if(!this.next_listeners[key]) this.next_listeners[key] = [];
    		this.next_listeners[key].push(listener);
    	var listener_index = this.next_listeners[key].indexOf(listener);
	var func = this.unsubscribe(this, key, listener_index, true);
	return func;
  },
  /** 
   * This function is used to broadcast the event, ie, proprty value change to all the registered event handlers.
   * @prototype function
   * @param {string} key - Property name or path
   * @param {object} oldValue - Old value of the property before the event
  */
  notify: function(key, oldValue) {
    var l_key;
    var newValue;
    if (this.locked) {
  		for (l_key in this.changed_prop) {
  			newValue = recursiveGet(this.data, l_key.split("."));
  			oldValue = this.changed_prop[l_key];
  			if(!this.listeners[l_key] || this.listeners[l_key].length < 1) return;
    			this.listeners[l_key].forEach((listenerAction) => listenerAction(oldValue, newValue));
  		}
  		for (l_key in this.lock_track_change) {
  			if(this.lock_track_change[l_key]['changed']) {
  				newValue = recursiveGet(this.data, l_key.split("."))
      			if(!this.next_listeners[l_key] || this.next_listeners[l_key].length < 1) return;
        			this.next_listeners[l_key].forEach((listenerAction) => listenerAction(this.lock_track_change[l_key]['oldValue'], newValue));
  			}
  		}
  		this.changed_prop = {}
  		this.lock_track_change = {}
  	} else {
      	for(l_key in oldValue) {
      		if (key.startsWith(l_key)){
      			newValue = recursiveGet(this.data, l_key.split("."));
      			if(!this.listeners[l_key] || this.listeners[l_key].length < 1) return;
        			this.listeners[l_key].forEach((listenerAction) => listenerAction(oldValue[l_key], newValue));
      		}
      	}
      	for(l_key in this.next_listeners) {
      		if (this.track_change[l_key] && this.track_change[l_key]['changed']) {
      			newValue = recursiveGet(this.data, l_key.split("."))
      			if(!this.next_listeners[l_key] || this.next_listeners[l_key].length < 1) return;
        		  this.next_listeners[l_key].forEach((listenerAction) => listenerAction(this.track_change[l_key]['oldValue'], newValue));
        			delete this.track_change[l_key];
      		}
      	}
      }
  },
  /** 
   * This function is used to deregister the registered event handlers.
   * @prototype function
   * @param {string} obj - Data object
   * @param {string} key - Property name or path
   * @param {int} index - Index of the listener 
   * @param {boolean} next - for checking
  */
  unsubscribe: function(obj, key, index, next) {
    return function(){
  		if(next){
        	if (key in obj.next_listeners) {
        		obj.next_listeners[key].pop(index);
        	}
      	}else {
      		if (key in obj.listeners) {
        		obj.listeners[key].pop(index);
        	}
      	}
  	}
  }
}

module.exports = {
  State:State
};
