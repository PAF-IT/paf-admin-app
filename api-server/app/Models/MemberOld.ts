import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class MemberOld extends BaseModel {

  public static table = 'member'

  @column({ isPrimary: true })
  public memberid: number

  @column.date()
  public startdate: DateTime

  @column.date()
  public renewdate: DateTime

  @column()
  public firstname: string

  @column()
  public lastname: string

  @column()
  public email: string

  @column()
  public street: string

  @column()
  public number: string

  @column()
  public zip: string

  @column()
  public city: string

  @column()
  public country: string

  @column()
  public newsletter: boolean | null
}
