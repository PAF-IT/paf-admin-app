import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class MemberPdf extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public member_id: number

  @column()
  public name: string

  @column()
  public email: string

  @column.date()
  public renew_date: DateTime

  @column()
  public file_path: string

}
