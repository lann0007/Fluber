import { Notify } from 'quasar'

/**
 * Handles Quasar notifications
 * We use Quasar's predefined types to indicate the type of message. See:
 * https://quasar.dev/quasar-plugins/notify#predefined-types
 * It's also possible to define our own types, but this isn't needed at the moment
 *
 * Source: https://gitlab.com/ternandsparrow/paratoo-fdcp/-/blob/95365881c86d116303df5e2534c8029a1a77fd39/paratoo-webapp/src/misc/helpers.js#L39
 * 
 * @param {('positive' | 'negative' | 'warning' | 'info' | 'ongoing')} type - the type of notification
 * @param {String} msg - the message to notify
 * @param {Error} [err] - an error, if type is 'negative'
 */
export function notifyHandler(type, msg, err) {
  const notificationTypes = [
    'positive',
    'negative',
    'warning',
    'info',
    'ongoing',
  ]
  if (!notificationTypes.includes(type)) {
    type = 'info' //no valid type provided, default to info
    let msg = 'notifyHandler was not provided with a valid `type`'
    throw new Error(msg)
  }
  if (type === 'ongoing') {
    let msg =
      '`ongoing` `type` provided to notifyHandler, which is not yet supported'
    throw new Error(msg)
  }
  let message
  if (err) {
    message = msg + '. ' + err
  } else {
    message = msg
  }
  Notify.create({
    type: type,
    message: message,
  })
}