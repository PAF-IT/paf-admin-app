import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext'
import {schema} from '@ioc:Adonis/Core/Validator'
import MattressTransaction from 'App/Models/MattressTransaction'
import {DateTime} from 'luxon'
import Account from 'App/Models/Account'
import Database from '@ioc:Adonis/Lucid/Database'


export default class MattressesController {

  public async store ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      allocator: schema.string(),
      transaction: schema.string(),
      type: schema.string(),
      name: schema.string(),
      description: schema.string.optional(),
      booking_id: schema.number.nullableAndOptional(),
      booking_nights: schema.number.nullableAndOptional(),
      amount: schema.number()
    })

    try {

      const validateTransaction = await request.validate({
        schema: validationSchema,
      })

      validateTransaction.description = validateTransaction.description === undefined ? '' : validateTransaction.description
      validateTransaction.booking_id = validateTransaction.booking_id === undefined ? null : validateTransaction.booking_id
      validateTransaction.booking_nights = validateTransaction.booking_nights === undefined ? null : validateTransaction.booking_nights
      const id = await MattressesController.createTransaction(validateTransaction.allocator, validateTransaction.transaction, validateTransaction.type,
        validateTransaction.name, validateTransaction.description, validateTransaction.booking_id, validateTransaction.booking_nights, validateTransaction.amount)
      return response.ok(id)

    } catch (error) {
      console.error(error.messages)
      return response.badRequest(error.messages)
    }
  }

  public async update ({ params, request, response }: HttpContextContract) {

    if (params.id) {

      const validationSchema = schema.create({
        allocator: schema.string(),
        transaction: schema.string(),
        type: schema.string(),
        name: schema.string(),
        description: schema.string.optional(),
        booking_id: schema.number.nullableAndOptional(),
        booking_nights: schema.number.nullableAndOptional(),
        amount: schema.number()
      })

      try {

        const validateTransaction = await request.validate({
          schema: validationSchema,
        })

        validateTransaction.description = validateTransaction.description === undefined ? '' : validateTransaction.description
        const transaction = await MattressTransaction.findOrFail(params.id)
        const formerAmount = transaction.amount
        const formerTransaction = transaction.transaction
        transaction.transaction = validateTransaction.transaction
        transaction.allocator = validateTransaction.allocator
        transaction.type = validateTransaction.type
        transaction.name = validateTransaction.name
        transaction.description = validateTransaction.description
        if (validateTransaction.booking_id !== undefined)
          transaction.booking_id = validateTransaction.booking_id
        if (validateTransaction.booking_nights !== undefined)
          transaction.booking_nights = validateTransaction.booking_nights
        transaction.amount = validateTransaction.amount

        await transaction.save()

        if (transaction.transaction === formerTransaction) {
          const accAmount = transaction.amount - formerAmount
          await MattressesController.updateAccounting(transaction.transaction, accAmount)
        } else {
          await MattressesController.updateAccounting(formerTransaction, -formerAmount)
          await MattressesController.updateAccounting(transaction.transaction, transaction.amount)
        }

        return response.ok(transaction.id)

      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('MattressTransaction transaction ID required')
    }
  }

  public async showByBookingId ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        const transaction = await Database.modelQuery(MattressTransaction).where('booking_id', '=', params.id)
        return response.json(transaction)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Event ID required')
    }
  }

  public async paginatedList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)
      const transaction = request.input('transaction', 'debit')
      const creditShowOnlyMattress = request.input('creditShowOnlyMattress', false)
      const name = request.input('name')

      const transactions = await Database
        .modelQuery(MattressTransaction)
        .if(name, (query) => {
          query.where('name', '=', name)
        })
        .if(transaction, (query) => {
          query.where('transaction', '=', transaction)
        })
        .if(creditShowOnlyMattress && transaction === 'credit', (query) => {
          query.where('type', '!=', 'stay').andWhere('type', '!=', 'membership')
        })
        .orderBy('id', 'desc')
        .paginate(page, limit)

      const query = 'SELECT transaction, type, COUNT(*) FROM mattress_transactions ' + (name ? 'WHERE name = "' + name + '" ' : '') + 'GROUP BY transaction, type'
      const counts = await Database.rawQuery(query)

      let returnData = JSON.parse(JSON.stringify(transactions))
      returnData.counts = counts[0]
      return response.json(returnData)
    } catch (error) {
      console.error(error.messages)
      return response.badRequest(error.messages)
    }
  }

  public async names ({ response }: HttpContextContract) {

    try {
      let transactions = await Database.rawQuery('SELECT name, MAX(date) FROM mattress_transactions WHERE allocator != \'system\' AND transaction != \'credit\' GROUP BY name ORDER BY MAX(date) DESC')
      transactions = transactions[0].map(b => b.name)
      return response.json(transactions)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public static async createTransaction(allocator: string, transact: string, type: string, name: string, description: string, booking_id: number | null, booking_nights: number | null, amount: number) {

    try {
      const transaction = new MattressTransaction()
      transaction.date = DateTime.now()
      transaction.allocator = allocator
      transaction.transaction = transact
      transaction.type = type
      transaction.name = name
      transaction.description = description
      transaction.booking_id = booking_id
      transaction.booking_nights = booking_nights
      transaction.amount = amount

      await transaction.save()

      await MattressesController.updateAccounting(transaction.transaction, transaction.amount)

      return transaction.id
    } catch (e) {
      console.error(e)
    }
  }

  public async showAccounting ({ response }: HttpContextContract) {

      try {
        const accounting = await Account.findOrFail(1)
        return response.json(accounting)
      } catch (error) {
        return response.badRequest(error.messages)
      }
  }

  public async showIncome ({ response }: HttpContextContract) {

    try {
      const yearlyIncome = await MattressTransaction.query().sum('amount as income').where('transaction', '=', 'credit').andWhere('date', '>=', DateTime.now().startOf('year').toSQLDate()).andWhere('date', '<=', DateTime.now().endOf('year').toSQLDate())
      return yearlyIncome[0]
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async showAllocatedNights ({ response }: HttpContextContract) {

    try {
      // const nights = await Booking.query().sum('stay_days as nights').where('mattress_booking', '=', 1).andWhere('paid', '=', 1)
      const nights = await MattressTransaction.query().sum('booking_nights as nights').where('transaction', '=', 'debit').andWhere('date', '>=', DateTime.now().startOf('year').toSQLDate()).andWhere('date', '<=', DateTime.now().endOf('year').toSQLDate())
      return nights[0]
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async delete ({ params, response }: HttpContextContract) {

    if (params.id) {

      try {

        const transaction = await MattressTransaction.findOrFail(params.id)
        await MattressesController.updateAccounting(transaction.transaction, -transaction.amount)
        await transaction.delete()

        return response.ok(transaction.id)

      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('MattressTransaction transaction ID required')
    }
  }

  private static async updateAccounting(transaction : string, amount: number) {

    let accounting = await Account.findOrFail(1)

    switch (transaction) {
      case 'credit':
        accounting.mattress_balance = accounting.mattress_balance + amount
        break
      case 'debit':
        accounting.mattress_balance = accounting.mattress_balance - amount
        break
      case 'reserve':
        accounting.mattress_reserved = accounting.mattress_reserved + amount
        break
    }

    await accounting.save()
  }
}
