import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Account extends BaseModel {
  @column({isPrimary: true})
  public id: number

  @column()
  public mattress_balance: number

  @column()
  public mattress_reserved: number
}
