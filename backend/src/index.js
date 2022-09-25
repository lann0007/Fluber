'use strict'

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
    await initPerms()
    await createTestUser('TestUser', 'password', 'testuser@mail.com')
  },
}

async function initPerms() {
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

  //get current list of permissions
  const exitingPermissions = await strapi.db
    .query('plugin::users-permissions.permission')
    .findMany({
      populate: true,
    })
    .catch((err) => {
      strapi.log.error(err)
    })

  await initPerm(exitingPermissions, 'plugin::users-permissions.user', ['me', 'update'], authenticatedRole)
  await initPerm(exitingPermissions, 'plugin::upload.content-api', ['findOne', 'upload'], authenticatedRole)

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
 * 
 * TODO don't allow during deployment using `process.env.NODE_ENV`
 * 
 * Source: https://gitlab.com/ternandsparrow/paratoo-fdcp/-/blob/95365881c86d116303df5e2534c8029a1a77fd39/paratoo-org/src/index.js
 */
async function createTestUser(
  username,
  password,
  email,
) {
  //check if user already exists
  let user = await strapi.query('plugin::users-permissions.user').findOne({
    where: { username: username },
  })
  //get the role ID for `authenticated`
  const roleOrm = strapi.query('plugin::users-permissions.role')
  const role = await roleOrm.findOne({ where: { type: 'authenticated' } })

  if (user) {
    strapi.log.info(
      `Testing user with username ${username} already exists, nothing to do.`,
    )
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
    await strapi.plugins['users-permissions'].services.user
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
  }
}
