'use strict';

var _ = require('lodash');
var Q = require('q');
var InstanceResource = require('../../../../../../base/InstanceResource');
var Page = require('../../../../../../base/Page');
var deserialize = require('../../../../../../base/deserialize');
var values = require('../../../../../../base/values');

var AllTimePage;
var AllTimeList;
var AllTimeInstance;
var AllTimeContext;

/**
 * @constructor Twilio.Api.V2010.AccountContext.UsageContext.RecordContext.AllTimePage
 * @augments Page
 * @description Initialize the AllTimePage
 *
 * @param {V2010} version - Version that contains the resource
 * @param {object} response - Response from the API
 * @param {string} accountSid -
 *          A 34 character string that uniquely identifies this resource.
 *
 * @returns AllTimePage
 */
function AllTimePage(version, response, accountSid) {
  Page.prototype.constructor.call(this, version, response);

  // Path Solution
  this._solution = {
    accountSid: accountSid
  };
}

_.extend(AllTimePage.prototype, Page.prototype);
AllTimePage.prototype.constructor = AllTimePage;

/**
 * Build an instance of AllTimeInstance
 *
 * @param {object} payload - Payload response from the API
 *
 * @returns AllTimeInstance
 */
AllTimePage.prototype.getInstance = function getInstance(payload) {
  return new AllTimeInstance(
    this._version,
    payload,
    this._solution.accountSid
  );
};


/**
 * @constructor Twilio.Api.V2010.AccountContext.UsageContext.RecordContext.AllTimeList
 * @description Initialize the AllTimeList
 *
 * @param {V2010} version - Version that contains the resource
 * @param {string} accountSid -
 *          A 34 character string that uniquely identifies this resource.
 *
 * @returns {function} - AllTimeListInstance
 */
function AllTimeList(version, accountSid) {
  /**
   * @memberof Twilio.Api.V2010.AccountContext.UsageContext.RecordContext.AllTimeList
   *
   * @param {string} sid - sid of instance
   *
   * @returns AllTimeContext
   */
  function AllTimeListInstance(sid) {
    return AllTimeListInstance.get(sid);
  }

  AllTimeListInstance._version = version;
  // Path Solution
  AllTimeListInstance._solution = {
    accountSid: accountSid
  };
  AllTimeListInstance._uri = _.template(
    '/Accounts/<%= accountSid %>/Usage/Records/AllTime.json' // jshint ignore:line
  )(AllTimeListInstance._solution);
  /**
   * @memberof AllTimeList
   *
   * @description Streams AllTimeInstance records from the API.
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
  AllTimeListInstance.each = function each(opts, callback) {
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
   * @memberof AllTimeList
   *
   * @description Lists AllTimeInstance records from the API as a list.
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
  AllTimeListInstance.list = function list(opts, callback) {
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
   * @memberof AllTimeList
   *
   * @description Retrieve a single page of AllTimeInstance records from the API.
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
  AllTimeListInstance.page = function page(opts, callback) {
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
      deferred.resolve(new AllTimePage(
        this._version,
        payload,
        this._solution.accountSid
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

  return AllTimeListInstance;
}


/**
 * @constructor Twilio.Api.V2010.AccountContext.UsageContext.RecordContext.AllTimeInstance
 * @augments InstanceResource
 * @description Initialize the AllTimeContext
 *
 * @property {string} accountSid - The account_sid
 * @property {string} apiVersion - The api_version
 * @property {all_time.category} category - The category
 * @property {string} count - The count
 * @property {string} countUnit - The count_unit
 * @property {string} description - The description
 * @property {Date} endDate - The end_date
 * @property {number} price - The price
 * @property {string} priceUnit - The price_unit
 * @property {Date} startDate - The start_date
 * @property {string} subresourceUris - The subresource_uris
 * @property {string} uri - The uri
 * @property {string} usage - The usage
 * @property {string} usageUnit - The usage_unit
 *
 * @param {V2010} version - Version that contains the resource
 * @param {object} payload - The instance payload
 */
function AllTimeInstance(version, payload, accountSid) {
  InstanceResource.prototype.constructor.call(this, version);

  // Marshaled Properties
  this._properties = {
    accountSid: payload.account_sid, // jshint ignore:line,
    apiVersion: payload.api_version, // jshint ignore:line,
    category: payload.category, // jshint ignore:line,
    count: payload.count, // jshint ignore:line,
    countUnit: payload.count_unit, // jshint ignore:line,
    description: payload.description, // jshint ignore:line,
    endDate: deserialize.rfc2822DateTime(payload.end_date), // jshint ignore:line,
    price: deserialize.decimal(payload.price), // jshint ignore:line,
    priceUnit: payload.price_unit, // jshint ignore:line,
    startDate: deserialize.rfc2822DateTime(payload.start_date), // jshint ignore:line,
    subresourceUris: payload.subresource_uris, // jshint ignore:line,
    uri: payload.uri, // jshint ignore:line,
    usage: payload.usage, // jshint ignore:line,
    usageUnit: payload.usage_unit, // jshint ignore:line,
  };

  // Context
  this._context = undefined;
  this._solution = {
    accountSid: accountSid,
  };
}

_.extend(AllTimeInstance.prototype, InstanceResource.prototype);
AllTimeInstance.prototype.constructor = AllTimeInstance;

Object.defineProperty(AllTimeInstance.prototype,
  'accountSid', {
  get: function() {
    return this._properties.accountSid;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'apiVersion', {
  get: function() {
    return this._properties.apiVersion;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'category', {
  get: function() {
    return this._properties.category;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'count', {
  get: function() {
    return this._properties.count;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'countUnit', {
  get: function() {
    return this._properties.countUnit;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'description', {
  get: function() {
    return this._properties.description;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'endDate', {
  get: function() {
    return this._properties.endDate;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'price', {
  get: function() {
    return this._properties.price;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'priceUnit', {
  get: function() {
    return this._properties.priceUnit;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'startDate', {
  get: function() {
    return this._properties.startDate;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'subresourceUris', {
  get: function() {
    return this._properties.subresourceUris;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'uri', {
  get: function() {
    return this._properties.uri;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'usage', {
  get: function() {
    return this._properties.usage;
  },
});

Object.defineProperty(AllTimeInstance.prototype,
  'usageUnit', {
  get: function() {
    return this._properties.usageUnit;
  },
});

module.exports = {
  AllTimePage: AllTimePage,
  AllTimeList: AllTimeList,
  AllTimeInstance: AllTimeInstance,
  AllTimeContext: AllTimeContext
};