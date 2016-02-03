'use strict';

var _ = require('lodash');
var PhoneNumberList = require('./v1/phoneNumber').PhoneNumberList;
var Version = require('../../base/Version');
var VoiceList = require('./v1/voice').VoiceList;


/**
 * Initialize the V1 version of Pricing
 *
 * @constructor Twilio.Pricing.V1
 *
 * @property {Twilio.Pricing.V1.PhoneNumberList} phoneNumbers -
 *          phoneNumbers resource
 * @property {Twilio.Pricing.V1.VoiceList} voice - voice resource
 *
 * @param {Twilio.Pricing} domain - The twilio domain
 */
function V1(domain) {
  Version.prototype.constructor.call(this, domain, 'v1');

  // Resources
  this._phoneNumbers = undefined;
  this._voice = undefined;
}

_.extend(V1.prototype, Version.prototype);
V1.prototype.constructor = V1;

Object.defineProperty(V1.prototype,
  'phoneNumbers', {
  get: function() {
    this._phoneNumbers = this._phoneNumbers || new PhoneNumberList(this);
    return this._phoneNumbers;
  },
});

Object.defineProperty(V1.prototype,
  'voice', {
  get: function() {
    this._voice = this._voice || new VoiceList(this);
    return this._voice;
  },
});

module.exports = V1;