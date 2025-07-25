import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import {DateTime} from "luxon"

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public invoice_nr: number

  @column({
    prepare: (value: Array<string>) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  public deleted_invoice_nrs: Array<string>

  @column()
  public price_meals: number

  @column()
  public price_membership: number

  @column()
  public short_stay_duration: number

  @column()
  public price_stay: number

  @column()
  public price_stay_short: number

  @column()
  public price_stay_month: number

  @column()
  public mattress_membership: number

  @column()
  public house_capacity: number

  @column()
  public text_meals: string

  @column()
  public text_membership: string

  @column()
  public text_stay: string

  @column()
  public sci_days: number

  @column()
  public last_sci_days_reset: number

  @column.date()
  public last_newsletter_retrieval: DateTime

  @column()
  public app_version: string | null
}
