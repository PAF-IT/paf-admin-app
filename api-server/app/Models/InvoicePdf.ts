import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class InvoicePdf extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public invoice_id: number

  @column()
  public invoice_nr: string

  @column()
  public name: string

  @column()
  public email: string

  @column.date()
  public date: DateTime

  @column()
  public file_path: string

}
