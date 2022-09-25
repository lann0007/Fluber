'use strict'
const fs = require('fs')

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap(/* { strapi } */) {
    //`driver` role is not part of the default roles, so we need to create it
    await strapi.db
      .query('plugin::users-permissions.role')
      .create({
        data: {
          type: 'driver',
          name: 'Driver',
          description: 'Specialisation of the default `authenticated` role'
        }
      })
      .catch((err) => {
        strapi.log.error(err)
      })

    //get roles to determine ID that needs to be provided to the creation of new permissions
    const roles = await strapi.db
      .query('plugin::users-permissions.role')
      .findMany()
      .catch((err) => {
        strapi.log.error(err)
      })

    const publicRole = roles.find(
      (o) => o.type === 'public' && o.name === 'Public'
    )
    const authenticatedRole = roles.find(
      (o) => o.type === 'authenticated' && o.name === 'Authenticated'
    )
    const driverRole = roles.find(
      (o) => o.type === 'driver' && o.name === 'Driver'
    )
    await initPerms({ publicRole, authenticatedRole, driverRole })

    //basic passengers
    await createTestUser('TestUser', 'password', 'testuser@mail.com', authenticatedRole)

    //drivers
    const driverUserResp = await createTestUser('TestDriver', 'password', 'testdriver@mail.com', driverRole)
    await createDriverProfile(driverUserResp, {
      firstName: 'John',
      lastName: 'Doe',
      licenseNumber: 'ABC123',
      vehicleRegistration: 'S123ABC',
    })
  },
}

/**
 * Inits permissions defined in code by calling `initPerm()`
 * 
 * @param {Object} param object containing roles
 * @param {Object} param.publicRole public role object
 * @param {Object} param.authenticatedRole authenticated role object
 * @param {Object} param.driverRole driver role object
 */
async function initPerms({ publicRole, authenticatedRole, driverRole }) {
  //get current list of permissions
  const exitingPermissions = await strapi.db
    .query('plugin::users-permissions.permission')
    .findMany({
      populate: true,
    })
    .catch((err) => {
      strapi.log.error(err)
    })

  //authenticated
  await initPerm(exitingPermissions, 'plugin::users-permissions.user', ['me', 'update'], authenticatedRole)
  await initPerm(exitingPermissions, 'plugin::upload.content-api', ['findOne', 'upload'], authenticatedRole)

  //driver
  await initPerm(exitingPermissions, 'plugin::users-permissions.user', ['me', 'update'], driverRole)
  await initPerm(exitingPermissions, 'plugin::upload.content-api', ['findOne', 'upload'], driverRole)

}

async function initPerm(exitingPermissions, api, actions, role) {
  for (const action of actions) {
    //check if perm exists before creating it
    if (
      !exitingPermissions.find(
        (o) =>
          o.action === `${api}.${action}` &&
          o.role.id === role.id
      )
    ) {
      strapi.log.info(
        `Setting permission: user with '${role.name}' role can do '${action}' on '${api}' (${api}.${action})`
      )
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({
          data: {
            action: `${api}.${action}`,
            role: role.id,
          },
        })
        .catch((err) => {
          strapi.log.error(err)
        })
    }
  }
}

/**
 * 
 * @param {String} username username
 * @param {String} password password
 * @param {String} email email
 * @param {Object} role Strapi role object to assign user to
 * 
 * @returns {Object | null} created user object or null
 * 
 * TODO don't allow during deployment using `process.env.NODE_ENV`
 * 
 * Source: https://gitlab.com/ternandsparrow/paratoo-fdcp/-/blob/95365881c86d116303df5e2534c8029a1a77fd39/paratoo-org/src/index.js
 */
async function createTestUser(
  username,
  password,
  email,
  role
) {
  //check if user already exists
  const user = await strapi.query('plugin::users-permissions.user').findOne({
    where: { username: username },
  })

  if (user) {
    strapi.log.info(
      `Testing user with username ${username} already exists, nothing to do.`,
    )
    return null
  } else {
    strapi.log.info(`Creating user for testing with username ${username}`)

    //create the user
    const testUserObj = {
      username: username,
      email: email,
      password: password,
      confirmed: true,
      blocked: false,
      role: role.id,
      provider: 'local',
    }
    const resp = await strapi.plugins['users-permissions'].services.user
      .add(testUserObj)
      .catch((err) => {
        strapi.log.error(err)
        let msg = `Couldn't create user ${username} for the ${role.name} role.`
        throw new Error(msg)
      })
    strapi.log.info(
      `Successfully created user ${username} for the ${role.name} role, ` +
      `with password=${password}`,
    )
    return resp
  }
}

/**
 * Creates a driver profile and links to the provided user 
 * based on: https://forum.strapi.io/t/upload-buffer-using-strapi-upload/18807/2
 * 
 * TODO: only allowing linking to `driverUser` that has the `driver` role
 * 
 * @param {Object} driverUser the user object of the user to link the driver profile to
 * @param {Object} testDriverProfile driver profile data
 * @param {String} testDriverProfile.firstName
 * @param {String} testDriverProfile.lastName
 * @param {String} testDriverProfile.licenseNumber
 * @param {String} testDriverProfile.vehicleRegistration
 * 
 * @returns {Object | null} object of created driver profile, or null
 */
async function createDriverProfile(driverUser, testDriverProfile) {
  //check for exiting driver with same details
  const driver = await strapi.db
    .query('api::driver-profile.driver-profile')
    .findOne({
      where: {
        firstName: testDriverProfile.firstName,
        lastName: testDriverProfile.lastName,
        licenseNumber: testDriverProfile.licenseNumber,
        vehicleRegistration: testDriverProfile.vehicleRegistration,
      }
    })
  if (driver) {
    strapi.log.info(
      `Testing driver profile with first name ${driver.firstName} and last name ${driver.lastName} already exists, nothing to do.`,
    )
    return null
  }

  //create the driver profile to be linked further down
  const driverProfileResp = await strapi.db
    .query('api::driver-profile.driver-profile')
    .create({
      data: testDriverProfile
    })
    .catch((err) => {
      strapi.log.error(err)
    })

  //now link this driver profile with the provided user
  await strapi.db
    .query('plugin::users-permissions.user')
    .update({
      where: { id: driverUser.id },
      data: {
        driverProfile: driverProfileResp.id
      },
    })
    .catch((err) => {
      strapi.log.error(err)
    })

  //init the identification for this Driver
  const { Readable } = require('stream')
  const getServiceUpload = (name) => {
    return strapi.plugin('upload').service(name)
  }
  const uploadAndLinkDocument = async (buffer, { filename, extension, mimeType, refId, ref, field }) => {
    const config = strapi.config.get('plugin.upload')

    // add generated document
    const entity = {
      name: filename,
      alternateText: filename,
      caption: filename,
      width: 0, //FIXME
      height: 0,  //FIXME
      hash: filename,
      ext: extension,
      mime: mimeType,
      size: buffer.length,
      provider: config.provider,
    }
    if (refId) {
      entity.related = [
        {
          id: refId,
          __type: ref,
          __pivot: { field },
        },
      ]
    }
    entity.getStream = () => Readable.from(buffer)
    await getServiceUpload('provider').upload(entity)
    const fileValues = { ...entity }
    const res = await strapi
      .query('plugin::upload.file')
      .create({ data: fileValues })
    return res
  }
  const file = fs.readFileSync('public/testDriverBirthCertificate.jpg', function (err, data) {
    if (err) throw err
    console.log('file data: ', data)
  })
  const resp = await uploadAndLinkDocument(file, {
    filename: 'testDriverBirthCertificate',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    refId: driverProfileResp.id,
    ref: 'api::driver-profile.driver-profile',
    field: 'identification'
  })

  strapi.log.info(
    `Successfully created driver profile for user ${driverUser.username} with first name ${driverProfileResp.firstName} and last name ${driverProfileResp.lastName}.`,
  )
  return driverProfileResp
}