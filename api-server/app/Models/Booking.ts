import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Booking extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public mattress_booking: boolean

  @column.date()
  public booking_date: DateTime

  @column()
  public name: string

  @column()
  public member_id: number | null

  @column()
  public sci_member: boolean | null

  @column()
  public email: string

  @column()
  public phone: string | null

  @column()
  public city: string | null

  @column.date()
  public arrival: DateTime

  @column.date()
  public departure: DateTime

  @column()
  public people_count: number | null

  @column()
  public membership_count: number | null

  @column()
  public info: string | null

  @column()
  public cancelled: boolean | null

  @column()
  public show_on_website: boolean

  @column()
  public paid: boolean | null

  @column.date()
  public date_paid: DateTime | null

  @column()
  public invoice_id: number | null

  @column()
  public invoice_nr: string

  @column()
  public no_stay_pay: boolean | null

  @column()
  public no_meal_pay: boolean | null

  @column()
  public longstayer: boolean | null

  @column()
  public group_name: string | null

  @column()
  public stay_days: number | null

  @column({
    prepare: (value: Array<number>) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  public paf_events: Array<{
  "id": number,
  "name": string,
  "confirmed": boolean,
  "abbreviation": string
  }> | null

  @column()
  public stay_rate: number | null

  @column()
  public institutional: boolean | null

  @column()
  public stay_amount: number

  @column()
  public membership_amount: number

  @column()
  public meals_amount: number

  @column()
  public custom_amount: number

  @column()
  public mattress_donation: number

  @column()
  public total_amount: number

  @column()
  public sci_days_used: number

  @column()
  public stay_amount_orig: number

  @column()
  public membership_amount_orig: number

  @column()
  public meals_amount_orig: number

  @column()
  public early_pay: boolean | null
}
