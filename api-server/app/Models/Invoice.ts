import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Invoice extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public invoice_nr: string

  @column()
  public name: string

  @column()
  public address: string

  @column()
  public city: string

  @column()
  public zip: string

  @column()
  public country: string

  @column()
  public email: string

  @column.date()
  public date: DateTime

  @column()
  public total_amount: number

  @column()
  public stay_label: string | null

  @column()
  public stay_amount: number

  @column.date()
  public stay_start: DateTime | null

  @column.date()
  public stay_end: DateTime | null

  @column()
  public membership_label: string | null

  @column()
  public membership_amount: number

  @column()
  public meals_label: string | null

  @column()
  public meals_amount: number

  @column()
  public custom_amount: number

  @column()
  public custom_label: string | null

  @column()
  public pdf_path: string | null

  @column()
  public payment_type: string

  @column.date()
  public date_paid: DateTime | null

  @column.date()
  public date_deposited: DateTime | null
}
