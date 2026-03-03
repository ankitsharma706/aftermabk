'use strict';

const User = require('./user.model');
const DailyLog = require('./dailyLog.model');
const HealthSummary = require('./healthSummary.model');
const Doctor = require('./doctor.model');
const Community = require('./community.model');
const CommunityMember = require('./communityMember.model');
const Ngo = require('./ngo.model');
const InsurancePlan = require('./insurancePlan.model');
const CalendarEvent = require('./calendarEvent.model');

module.exports = {
  User,
  DailyLog,
  HealthSummary,
  Doctor,
  Community,
  CommunityMember,
  Ngo,
  InsurancePlan,
  CalendarEvent,
};
