'use strict';

var _ = require('lodash');
var Q = require('q');
var CredentialListList = require('./trunk/credentialList').CredentialListList;
var InstanceContext = require('../../../base/InstanceContext');
var InstanceResource = require('../../../base/InstanceResource');
var IpAccessControlListList = require(
    './trunk/ipAccessControlList').IpAccessControlListList;
var OriginationUrlList = require('./trunk/originationUrl').OriginationUrlList;
var Page = require('../../../base/Page');
var PhoneNumberList = require('./trunk/phoneNumber').PhoneNumberList;
var deserialize = require('../../../base/deserialize');
var values = require('../../../base/values');

var TrunkPage;
var TrunkList;
var TrunkInstance;
var TrunkContext;

/**
 * @constructor Twilio.Trunking.V1.TrunkPage
 * @augments Page
 * @description Initialize the TrunkPage
 *
 * @param {V1} version - Version that contains the resource
 * @param {object} response - Response from the API
 *
 * @returns TrunkPage
 */
function TrunkPage(version, response) {
  Page.prototype.constructor.call(this, version, response);

  // Path Solution
  this._solution = {};
}

_.extend(TrunkPage.prototype, Page.prototype);
TrunkPage.prototype.constructor = TrunkPage;

/**
 * Build an instance of TrunkInstance
 *
 * @param {object} payload - Payload response from the API
 *
 * @returns TrunkInstance
 */
TrunkPage.prototype.getInstance = function getInstance(payload) {
  return new TrunkInstance(
    this._version,
    payload
  );
};


/**
 * @constructor Twilio.Trunking.V1.TrunkList
 * @description Initialize the TrunkList
 *
 * @param {V1} version - Version that contains the resource
 *
 * @returns {function} - TrunkListInstance
 */
function TrunkList(version) {
  /**
   * @memberof Twilio.Trunking.V1.TrunkList
   *
   * @param {string} sid - sid of instance
   *
   * @returns TrunkContext
   */
  function TrunkListInstance(sid) {
    return TrunkListInstance.get(sid);
  }

  TrunkListInstance._version = version;
  // Path Solution
  TrunkListInstance._solution = {};
  TrunkListInstance._uri = _.template(
    '/Trunks' // jshint ignore:line
  )(TrunkListInstance._solution);
  /**
   * @memberof TrunkList
   *
   * @description Create a new TrunkInstance
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @param {object|function} opts - ...
   * @param {string} [opts.friendlyName] - The friendly_name
   * @param {string} [opts.domainName] - The domain_name
   * @param {string} [opts.disasterRecoveryUrl] - The disaster_recovery_url
   * @param {string} [opts.disasterRecoveryMethod] - The disaster_recovery_method
   * @param {string} [opts.recording] - The recording
   * @param {string} [opts.secure] - The secure
   * @param {function} [callback] - Callback to handle created record
   *
   * @returns {Promise} Resolves to newly created TrunkInstance
   */
  TrunkListInstance.create = function create(opts, callback) {
    if (_.isFunction(opts)) {
      callback = opts;
      opts = {};
    }
    opts = opts || {};

    var deferred = Q.defer();
    var data = values.of({
      'FriendlyName': opts.friendlyName,
      'DomainName': opts.domainName,
      'DisasterRecoveryUrl': opts.disasterRecoveryUrl,
      'DisasterRecoveryMethod': opts.disasterRecoveryMethod,
      'Recording': opts.recording,
      'Secure': opts.secure
    });

    var promise = this._version.create({
      uri: this._uri,
      method: 'POST',
      data: data
    });

    promise = promise.then(function(payload) {
      deferred.resolve(new TrunkInstance(
        this._version,
        payload
      ));
    }.bind(this));

    promise.catch(function(error) {
      deferred.reject(error);
    });

    if (_.isFunction(callback)) {
      deferred.promise.nodeify(callback);
    }

    return deferred.promise;
  };

  /**
   * @memberof TrunkList
   *
   * @description Streams TrunkInstance records from the API.
   *
   * This operation lazily loads records as efficiently as possible until the limit
   * is reached.
   *
   * The results are passed into the callback function, so this operation is memory efficient.
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @param {object|function} opts - ...
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize=50] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no pageSize is defined but a limit is defined,
   *         list() will attempt to read the limit with the most efficient
   *         page size, i.e. min(limit, 1000)
   * @param {Function} [opts.callback] -
   *         Function to process each record. If this and a positional
   * callback are passed, this one will be used
   * @param {Function} [opts.done] -
   *          Function to be called upon completion of streaming
   * @param {Function} [callback] - Function to process each record
   */
  TrunkListInstance.each = function each(opts, callback) {
    opts = opts || {};
    if (_.isFunction(opts)) {
      opts = { callback: opts };
    } else if (_.isFunction(callback) && !_.isFunction(opts.callback)) {
      opts.callback = callback;
    }

    if (_.isUndefined(opts.callback)) {
      throw new Error('Callback function must be provided');
    }

    var done = false;
    var currentPage = 1;
    var limits = this._version.readLimits({
      limit: opts.limit,
      pageSize: opts.pageSize
    });

    function onComplete(error) {
      done = true;
      if (_.isFunction(opts.done)) {
        opts.done(error);
      }
    }

    function fetchNextPage(fn) {
      var promise = fn();
      if (_.isUndefined(promise)) {
        onComplete();
        return;
      }

      promise.then(function(page) {
        _.each(page.instances, function(instance) {
          if (done) {
            return false;
          }

          opts.callback(instance, onComplete);
        });

        if ((limits.pageLimit && limits.pageLimit <= currentPage)) {
          onComplete();
        } else if (!done) {
          currentPage++;
          fetchNextPage(_.bind(page.nextPage, page));
        }
      });

      promise.catch(onComplete);
    }

    fetchNextPage(_.bind(this.page, this, opts));
  };

  /**
   * @memberof TrunkList
   *
   * @description Lists TrunkInstance records from the API as a list.
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @param {object|function} opts - ...
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no page_size is defined but a limit is defined,
   *         list() will attempt to read the limit with the most
   *         efficient page size, i.e. min(limit, 1000)
   * @param {function} [callback] - Callback to handle list of records
   *
   * @returns {Promise} Resolves to a list of records
   */
  TrunkListInstance.list = function list(opts, callback) {
    if (_.isFunction(opts)) {
      callback = opts;
      opts = {};
    }
    opts = opts || {};
    var deferred = Q.defer();
    var allResources = [];
    opts.callback = function(resource) {
      allResources.push(resource);
    };

    opts.done = function(error) {
      if (_.isUndefined(error)) {
        deferred.resolve(allResources);
      } else {
        deferred.reject(error);
      }
    };

    if (_.isFunction(callback)) {
      deferred.promise.nodeify(callback);
    }

    this.each(opts);
    return deferred.promise;
  };

  /**
   * @memberof TrunkList
   *
   * @description Retrieve a single page of TrunkInstance records from the API.
   * Request is executed immediately
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @param {object|function} opts - ...
   * @param {string} [opts.pageToken] - PageToken provided by the API
   * @param {number} [opts.pageNumber] -
   *          Page Number, this value is simply for client state
   * @param {number} [opts.pageSize] - Number of records to return, defaults to 50
   * @param {function} [callback] - Callback to handle list of records
   *
   * @returns {Promise} Resolves to a list of records
   */
  TrunkListInstance.page = function page(opts, callback) {
    var deferred = Q.defer();
    var data = values.of({
      'PageToken': opts.pageToken,
      'Page': opts.pageNumber,
      'PageSize': opts.pageSize
    });

    var promise = this._version.page({
      uri: this._uri,
      method: 'GET',
      params: data
    });

    promise = promise.then(function(payload) {
      deferred.resolve(new TrunkPage(
        this._version,
        payload
      ));
    }.bind(this));

    promise.catch(function(error) {
      deferred.reject(error);
    });

    if (_.isFunction(callback)) {
      deferred.promise.nodeify(callback);
    }

    return deferred.promise;
  };

  /**
   * @memberof Twilio.Trunking.V1.TrunkList
   *
   * @description Constructs a TrunkContext
   *
   * @param {string} sid - The sid
   *
   * @returns TrunkContext
   */
  TrunkListInstance.get = function get(sid) {
    return new TrunkContext(
      this._version,
      sid
    );
  };

  return TrunkListInstance;
}


/**
 * @constructor Twilio.Trunking.V1.TrunkInstance
 * @augments InstanceResource
 * @description Initialize the TrunkContext
 *
 * @property {string} accountSid - The account_sid
 * @property {string} domainName - The domain_name
 * @property {string} disasterRecoveryMethod - The disaster_recovery_method
 * @property {string} disasterRecoveryUrl - The disaster_recovery_url
 * @property {string} friendlyName - The friendly_name
 * @property {string} secure - The secure
 * @property {string} recording - The recording
 * @property {string} authType - The auth_type
 * @property {string} authTypeSet - The auth_type_set
 * @property {Date} dateCreated - The date_created
 * @property {Date} dateUpdated - The date_updated
 * @property {string} sid - The sid
 * @property {string} url - The url
 * @property {string} links - The links
 *
 * @param {V1} version - Version that contains the resource
 * @param {object} payload - The instance payload
 * @param {sid} sid - The sid
 */
function TrunkInstance(version, payload, sid) {
  InstanceResource.prototype.constructor.call(this, version);

  // Marshaled Properties
  this._properties = {
    accountSid: payload.account_sid, // jshint ignore:line,
    domainName: payload.domain_name, // jshint ignore:line,
    disasterRecoveryMethod: payload.disaster_recovery_method, // jshint ignore:line,
    disasterRecoveryUrl: payload.disaster_recovery_url, // jshint ignore:line,
    friendlyName: payload.friendly_name, // jshint ignore:line,
    secure: payload.secure, // jshint ignore:line,
    recording: payload.recording, // jshint ignore:line,
    authType: payload.auth_type, // jshint ignore:line,
    authTypeSet: payload.auth_type_set, // jshint ignore:line,
    dateCreated: deserialize.iso8601DateTime(payload.date_created), // jshint ignore:line,
    dateUpdated: deserialize.iso8601DateTime(payload.date_updated), // jshint ignore:line,
    sid: payload.sid, // jshint ignore:line,
    url: payload.url, // jshint ignore:line,
    links: payload.links, // jshint ignore:line,
  };

  // Context
  this._context = undefined;
  this._solution = {
    sid: sid || this._properties.sid,
  };
}

_.extend(TrunkInstance.prototype, InstanceResource.prototype);
TrunkInstance.prototype.constructor = TrunkInstance;

Object.defineProperty(TrunkInstance.prototype,
  '_proxy', {
  get: function() {
    if (!this._context) {
      this._context = new TrunkContext(
        this._version,
        this._solution.sid
      );
    }

    return this._context;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'accountSid', {
  get: function() {
    return this._properties.accountSid;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'domainName', {
  get: function() {
    return this._properties.domainName;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'disasterRecoveryMethod', {
  get: function() {
    return this._properties.disasterRecoveryMethod;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'disasterRecoveryUrl', {
  get: function() {
    return this._properties.disasterRecoveryUrl;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'friendlyName', {
  get: function() {
    return this._properties.friendlyName;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'secure', {
  get: function() {
    return this._properties.secure;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'recording', {
  get: function() {
    return this._properties.recording;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'authType', {
  get: function() {
    return this._properties.authType;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'authTypeSet', {
  get: function() {
    return this._properties.authTypeSet;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'dateCreated', {
  get: function() {
    return this._properties.dateCreated;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'dateUpdated', {
  get: function() {
    return this._properties.dateUpdated;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'sid', {
  get: function() {
    return this._properties.sid;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'url', {
  get: function() {
    return this._properties.url;
  },
});

Object.defineProperty(TrunkInstance.prototype,
  'links', {
  get: function() {
    return this._properties.links;
  },
});

/**
 * @description Fetch a TrunkInstance
 *
 * @param {function} [callback] - Callback to handle fetched record
 *
 * @returns {Promise} Resolves to fetched TrunkInstance
 */
TrunkInstance.prototype.fetch = function fetch(callback) {
  var deferred = Q.defer();
  var promise = this._version.fetch({
    uri: this._uri,
    method: 'GET'
  });

  promise = promise.then(function(payload) {
    deferred.resolve(new TrunkInstance(
      this._version,
      payload,
      this._solution.sid
    ));
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

/**
 * @description Deletes the TrunkInstance
 *
 * @param {function} [callback] - Callback to handle deleted record
 *
 * @returns Resolves to true if delete succeeds, false otherwise
 */
TrunkInstance.prototype.remove = function remove(callback) {
  var deferred = Q.defer();
  var promise = this._version.remove({
    uri: this._uri,
    method: 'DELETE'
  });

  promise = promise.then(function(payload) {
    deferred.resolve(payload);
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

/**
 * @description Update the TrunkInstance
 *
 * If a function is passed as the first argument, it will be used as the callback function.
 *
 * @param {object|function} opts - ...
 * @param {string} [opts.friendlyName] - The friendly_name
 * @param {string} [opts.domainName] - The domain_name
 * @param {string} [opts.disasterRecoveryUrl] - The disaster_recovery_url
 * @param {string} [opts.disasterRecoveryMethod] - The disaster_recovery_method
 * @param {string} [opts.recording] - The recording
 * @param {string} [opts.secure] - The secure
 * @param {function} [callback] - Callback to handle updated record
 *
 * @returns {Promise} Resolves to updated TrunkInstance
 */
TrunkInstance.prototype.update = function update(opts, callback) {
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }
  opts = opts || {};

  var deferred = Q.defer();
  var data = values.of({
    'FriendlyName': opts.friendlyName,
    'DomainName': opts.domainName,
    'DisasterRecoveryUrl': opts.disasterRecoveryUrl,
    'DisasterRecoveryMethod': opts.disasterRecoveryMethod,
    'Recording': opts.recording,
    'Secure': opts.secure
  });

  var promise = this._version.update({
    uri: this._uri,
    method: 'POST',
    data: data
  });

  promise = promise.then(function(payload) {
    deferred.resolve(new TrunkInstance(
      this._version,
      payload,
      this._solution.sid
    ));
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

/**
 * Access the originationUrls
 *
 * @returns originationUrls
 */
TrunkInstance.prototype.originationUrls = function originationUrls() {
  return this._proxy.originationUrls;
};

/**
 * Access the credentialsLists
 *
 * @returns credentialsLists
 */
TrunkInstance.prototype.credentialsLists = function credentialsLists() {
  return this._proxy.credentialsLists;
};

/**
 * Access the ipAccessControlLists
 *
 * @returns ipAccessControlLists
 */
TrunkInstance.prototype.ipAccessControlLists = function ipAccessControlLists() {
  return this._proxy.ipAccessControlLists;
};

/**
 * Access the phoneNumbers
 *
 * @returns phoneNumbers
 */
TrunkInstance.prototype.phoneNumbers = function phoneNumbers() {
  return this._proxy.phoneNumbers;
};


/**
 * @constructor Twilio.Trunking.V1.TrunkContext
 * @augments InstanceContext
 * @description Initialize the TrunkContext
 *
 * @property {Twilio.Trunking.V1.TrunkContext.OriginationUrlList} originationUrls -
 *          originationUrls resource
 * @property {Twilio.Trunking.V1.TrunkContext.CredentialListList} credentialsLists -
 *          credentialsLists resource
 * @property {Twilio.Trunking.V1.TrunkContext.IpAccessControlListList} ipAccessControlLists -
 *          ipAccessControlLists resource
 * @property {Twilio.Trunking.V1.TrunkContext.PhoneNumberList} phoneNumbers -
 *          phoneNumbers resource
 *
 * @param {V1} version - Version that contains the resource
 * @param {sid} sid - The sid
 */
function TrunkContext(version, sid) {
  InstanceContext.prototype.constructor.call(this, version);

  // Path Solution
  this._solution = {
    sid: sid,
  };
  this._uri = _.template(
    '/Trunks/<%= sid %>' // jshint ignore:line
  )(this._solution);

  // Dependents
  this._originationUrls = undefined;
  this._credentialsLists = undefined;
  this._ipAccessControlLists = undefined;
  this._phoneNumbers = undefined;
}

_.extend(TrunkContext.prototype, InstanceContext.prototype);
TrunkContext.prototype.constructor = TrunkContext;

/**
 * @description Fetch a TrunkInstance
 *
 * @param {function} [callback] - Callback to handle fetched record
 *
 * @returns {Promise} Resolves to fetched TrunkInstance
 */
TrunkContext.prototype.fetch = function fetch(callback) {
  var deferred = Q.defer();
  var promise = this._version.fetch({
    uri: this._uri,
    method: 'GET'
  });

  promise = promise.then(function(payload) {
    deferred.resolve(new TrunkInstance(
      this._version,
      payload,
      this._solution.sid
    ));
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

/**
 * @description Deletes the TrunkInstance
 *
 * @param {function} [callback] - Callback to handle deleted record
 *
 * @returns Resolves to true if delete succeeds, false otherwise
 */
TrunkContext.prototype.remove = function remove(callback) {
  var deferred = Q.defer();
  var promise = this._version.remove({
    uri: this._uri,
    method: 'DELETE'
  });

  promise = promise.then(function(payload) {
    deferred.resolve(payload);
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

/**
 * @description Update the TrunkInstance
 *
 * If a function is passed as the first argument, it will be used as the callback function.
 *
 * @param {object|function} opts - ...
 * @param {string} [opts.friendlyName] - The friendly_name
 * @param {string} [opts.domainName] - The domain_name
 * @param {string} [opts.disasterRecoveryUrl] - The disaster_recovery_url
 * @param {string} [opts.disasterRecoveryMethod] - The disaster_recovery_method
 * @param {string} [opts.recording] - The recording
 * @param {string} [opts.secure] - The secure
 * @param {function} [callback] - Callback to handle updated record
 *
 * @returns {Promise} Resolves to updated TrunkInstance
 */
TrunkContext.prototype.update = function update(opts, callback) {
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }
  opts = opts || {};

  var deferred = Q.defer();
  var data = values.of({
    'FriendlyName': opts.friendlyName,
    'DomainName': opts.domainName,
    'DisasterRecoveryUrl': opts.disasterRecoveryUrl,
    'DisasterRecoveryMethod': opts.disasterRecoveryMethod,
    'Recording': opts.recording,
    'Secure': opts.secure
  });

  var promise = this._version.update({
    uri: this._uri,
    method: 'POST',
    data: data
  });

  promise = promise.then(function(payload) {
    deferred.resolve(new TrunkInstance(
      this._version,
      payload,
      this._solution.sid
    ));
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

Object.defineProperty(TrunkContext.prototype,
  'originationUrls', {
  get: function() {
    if (!this._originationUrls) {
      this._originationUrls = new OriginationUrlList(
        this._version,
        this._solution.sid
      );
    }
    return this._originationUrls;
  },
});

Object.defineProperty(TrunkContext.prototype,
  'credentialsLists', {
  get: function() {
    if (!this._credentialsLists) {
      this._credentialsLists = new CredentialListList(
        this._version,
        this._solution.sid
      );
    }
    return this._credentialsLists;
  },
});

Object.defineProperty(TrunkContext.prototype,
  'ipAccessControlLists', {
  get: function() {
    if (!this._ipAccessControlLists) {
      this._ipAccessControlLists = new IpAccessControlListList(
        this._version,
        this._solution.sid
      );
    }
    return this._ipAccessControlLists;
  },
});

Object.defineProperty(TrunkContext.prototype,
  'phoneNumbers', {
  get: function() {
    if (!this._phoneNumbers) {
      this._phoneNumbers = new PhoneNumberList(
        this._version,
        this._solution.sid
      );
    }
    return this._phoneNumbers;
  },
});

module.exports = {
  TrunkPage: TrunkPage,
  TrunkList: TrunkList,
  TrunkInstance: TrunkInstance,
  TrunkContext: TrunkContext
};