'use strict';

/**
 * completed-trip service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::completed-trip.completed-trip');
