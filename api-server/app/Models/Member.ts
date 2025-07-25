import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Member extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column.date()
  public start_date: DateTime

  @column.date()
  public renew_date: DateTime

  @column()
  public name: string

  @column()
  public email: string

  @column()
  public address: string

  @column()
  public zip: string

  @column()
  public city: string

  @column()
  public country: string

  @column()
  public newsletter: boolean | null

  @column()
  public sci_member: boolean | null

  @column()
  public sci_days_used: number

  @column()
  public sci_days_used_prev_year: number

  @column()
  public pdf_path: string | null
}
