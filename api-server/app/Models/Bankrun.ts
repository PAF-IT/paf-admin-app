import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Bankrun extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column.date()
  public date: DateTime

  @column({
    prepare: (value: Array<any>) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  public invoices: Array<string>

  @column()
  public total_amount_cash: number

  @column()
  public total_amount_cheque: number
}
