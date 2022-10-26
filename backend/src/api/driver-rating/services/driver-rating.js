'use strict';

/**
 * driver-rating service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::driver-rating.driver-rating');
