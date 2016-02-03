'use strict';
var _ = require('lodash');

/**
 * Base domain object
 *
 * @constructor
 *
 * @param {Twilio} twilio - A Twilio Client
 * @param {string} baseUrl - Base url for this domain
 */
function Domain(twilio, baseUrl) {
  this.twilio = twilio;
  this.baseUrl = baseUrl;
}

Domain.prototype.absoluteUrl = function(uri) {
  return _.trim(this.baseUrl, '/') + '/' + _.trim(uri, '/');
};

/**
 * Make request to this domain
 */
Domain.prototype.request = function(opts) {
  return this.twilio.request(_.assign({}, opts, {
    uri: this.absoluteUrl(opts.uri),
  }));
};

module.exports = Domain;