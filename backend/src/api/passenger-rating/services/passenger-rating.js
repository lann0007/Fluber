'use strict';

/**
 * passenger-rating service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::passenger-rating.passenger-rating');
