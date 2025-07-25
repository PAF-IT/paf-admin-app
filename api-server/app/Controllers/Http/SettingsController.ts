import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Setting from 'App/Models/Setting'
import {DateTime} from 'luxon'


export default class SettingsController {

  public async update ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      price_meals: schema.number.optional(),
      price_membership: schema.number.optional(),
      short_stay_duration: schema.number.optional(),
      price_stay: schema.number.optional(),
      price_stay_short: schema.number.optional(),
      price_stay_month: schema.number.optional(),
      mattress_membership: schema.number.optional(),
      house_capacity: schema.number.optional(),
      text_meals: schema.string.optional(),
      text_membership: schema.string.optional(),
      text_stay: schema.string.optional(),
      sci_days: schema.number.optional(),
      last_newsletter_retrieval: schema.date.optional(),
      app_version: schema.string.optional()
    })

    try {

      const validateSetting = await request.validate({
        schema: validationSchema,
      })

      const setting = await Setting.findOrFail(1)
      if (validateSetting.price_meals !== undefined)
        setting.price_meals = validateSetting.price_meals
      if (validateSetting.price_membership !== undefined)
        setting.price_membership = validateSetting.price_membership
      if (validateSetting.short_stay_duration !== undefined)
        setting.short_stay_duration = validateSetting.short_stay_duration
      if (validateSetting.price_stay !== undefined)
        setting.price_stay = validateSetting.price_stay
      if (validateSetting.price_stay_short !== undefined)
        setting.price_stay_short = validateSetting.price_stay_short
      if (validateSetting.price_stay_month !== undefined)
        setting.price_stay_month = validateSetting.price_stay_month
      if (validateSetting.mattress_membership !== undefined)
        setting.mattress_membership = validateSetting.mattress_membership
      if (validateSetting.house_capacity !== undefined)
        setting.house_capacity = validateSetting.house_capacity
      if (validateSetting.text_meals !== undefined)
        setting.text_meals = validateSetting.text_meals
      if (validateSetting.text_membership !== undefined)
        setting.text_membership = validateSetting.text_membership
      if (validateSetting.text_stay !== undefined)
        setting.text_stay = validateSetting.text_stay
      if (validateSetting.sci_days !== undefined)
        setting.sci_days = validateSetting.sci_days
      if (validateSetting.last_newsletter_retrieval !== undefined && validateSetting.last_newsletter_retrieval != null)
        setting.last_newsletter_retrieval = DateTime.fromISO(<string>validateSetting.last_newsletter_retrieval.toISODate())
      if (validateSetting.app_version !== undefined)
        setting.app_version = validateSetting.app_version

      await setting.save()

      return response.ok('Settings updated')

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async list ({ response }: HttpContextContract) {

      try {
        const settings = await Setting.findOrFail(1)
        if (settings.invoice_nr.toString().substring(0,2) !== DateTime.now().year.toString().substring(2)) {
          settings.invoice_nr = 1 + (DateTime.now().year - 2000) * 10000
          await settings.save()
        }
        return response.json(settings)
      } catch (error) {
        return response.badRequest(error.messages)
      }
  }
}
