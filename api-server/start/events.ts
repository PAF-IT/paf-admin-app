/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
import Event from '@ioc:Adonis/Core/Event'
// import Mail from "@ioc:Adonis/Addons/Mail"
import Database from '@ioc:Adonis/Lucid/Database'

Event.on('db:query', Database.prettyPrint)

// Event.on('mail:sent', Mail.prettyPrint)
// Event.on('mail:sent', ({ message, views, mailer, response }) => {
//   console.log(message)
//   console.log(views)
//   console.log(mailer)
//   console.log(response)
// })
