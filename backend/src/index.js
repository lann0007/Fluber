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
    await createTestUser('TestUser', 'password', 'testuser@mail.com')
  },
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
