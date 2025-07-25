import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {schema} from '@ioc:Adonis/Core/Validator'
import Bankrun from 'App/Models/Bankrun'
import Database from '@ioc:Adonis/Lucid/Database'
import {DateTime} from 'luxon'
import Invoice from 'App/Models/Invoice'


export default class BankrunController {

  public async store ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      date: schema.date(),
      invoices: schema.array().members(schema.string()),
      total_amount_cash: schema.number(),
      total_amount_cheque: schema.number()
    })

    try {

      const validateBankrun = await request.validate({
        schema: validationSchema,
      })

      const bankrun = new Bankrun()
      bankrun.date = DateTime.fromISO(<string>validateBankrun.date.toISODate())
      bankrun.invoices = validateBankrun.invoices
      bankrun.total_amount_cash = validateBankrun.total_amount_cash
      bankrun.total_amount_cheque = validateBankrun.total_amount_cheque
      await bankrun.save()

      if (bankrun.invoices) {
        for (const nr of bankrun.invoices) {
          let invoice = await Invoice.findBy('invoice_nr', nr)
          if (invoice) {
            invoice.date_deposited = bankrun.date
            await invoice.save()
          }
        }
      }

      return response.ok(bankrun.id)

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async update ({ params, request, response }: HttpContextContract) {

    if (params.id) {

      const validationSchema = schema.create({
        date: schema.date(),
        invoices: schema.array().members(schema.string()),
        total_amount_cash: schema.number(),
        total_amount_cheque: schema.number()
      })

      try {

        const validateBankrun = await request.validate({
          schema: validationSchema,
        })

        const bankrun = await Bankrun.findOrFail(params.id)
        const previousInvoices = JSON.parse(JSON.stringify(bankrun.invoices))
        const removedInvoices = previousInvoices.filter(i => !validateBankrun.invoices.includes(i))
        bankrun.date = DateTime.fromISO(<string>validateBankrun.date.toISODate())
        bankrun.invoices = validateBankrun.invoices
        bankrun.total_amount_cash = validateBankrun.total_amount_cash
        bankrun.total_amount_cheque = validateBankrun.total_amount_cheque
        await bankrun.save()

        if (removedInvoices.length > 0) {
          for (const nr of removedInvoices) {
            let invoice = await Invoice.findBy('invoice_nr', nr)
            if (invoice) {
              invoice.date_deposited = null
              await invoice.save()
            }
          }
        }

        if (bankrun.invoices) {
          for (const nr of bankrun.invoices) {
            let invoice = await Invoice.findBy('invoice_nr', nr)
            if (invoice) {
              invoice.date_deposited = bankrun.date
              await invoice.save()
            }
          }
        }

        return response.ok(bankrun.id)

      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Bankrun ID required')
    }
  }

  public async paginatedList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)

      const bankruns = await Database.modelQuery(Bankrun).where('id', '>', 0).orderBy('date', 'desc').paginate(page, limit)
      return response.json(bankruns)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }
}
