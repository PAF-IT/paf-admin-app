import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import {DateTime} from "luxon"

export default class MattressTransaction extends BaseModel {
  @column({isPrimary: true})
  public id: number

  @column.date()
  public date: DateTime

  @column()
  public allocator: string

  @column()
  public transaction: string

  @column()
  public type: string

  @column()
  public name: string

  @column()
  public description: string

  @column()
  public booking_id: number | null

  @column()
  public booking_nights: number | null

  @column()
  public amount: number
}
