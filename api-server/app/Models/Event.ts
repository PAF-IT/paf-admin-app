import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Event extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public abbreviation: string

  @column.date()
  public start_date: DateTime

  @column.date()
  public end_date: DateTime

  @column()
  public contact_email: string | null

  @column()
  public announcement_link: string | null

  @column()
  public max_participants: number | null

  @column()
  public participant_count: number

  @column({
    // prepare: (value: Array<number>) => JSON.stringify(value),
    prepare: (value: Array<object>) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  public bookings: Array<object> | null

  @column()
  public info: string | null

  @column()
  public event_price_day: number | null

  @column()
  public meal_price_day: number | null
}
