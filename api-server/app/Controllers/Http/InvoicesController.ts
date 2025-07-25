import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {rules, schema} from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Booking from 'App/Models/Booking'
import Invoice from 'App/Models/Invoice'
import Setting from 'App/Models/Setting'
import _ from 'lodash'
import fs from 'fs'
import {DateTime} from 'luxon'
import Mail from '@ioc:Adonis/Addons/Mail'
import Application from '@ioc:Adonis/Core/Application'
import Dropbox from './Dropbox'


export default class InvoicesController {

  public async store ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      id: schema.number.optional(),
      invoice_nr: schema.string(),
      booking_id: schema.number.optional(),
      name: schema.string(),
      address: schema.string(),
      zip: schema.string(),
      city: schema.string(),
      country: schema.string(),
      email: schema.string({ trim: true }, [
        rules.email(),
      ]),
      date: schema.date(),
      total_amount: schema.number.optional(),
      stay_amount: schema.number.optional(),
      stay_start: schema.date.optional(),
      stay_end: schema.date.optional(),
      membership_amount: schema.number.optional(),
      meals_amount: schema.number.optional(),
      custom_amount: schema.number.optional(),
      custom_label: schema.string.optional(),
      payment_type: schema.string(),
      date_paid: schema.date.optional()
    })

    try {
      const [validateInvoice] = await Promise.all([request.validate({
        schema: validationSchema,
      })])

      if (validateInvoice.stay_amount == undefined && validateInvoice.membership_amount == undefined && validateInvoice.meals_amount == undefined && validateInvoice.custom_amount == undefined)
        return response.badRequest('No amounts submitted')

      let invoice
      let changedInvoiceNumber
      const setting = await Setting.findOrFail(1)
      if (validateInvoice.id !== undefined && validateInvoice.id !== null) {
        try {
          invoice = await Invoice.findOrFail(validateInvoice.id)
        } catch (error) {
        }
      }
      if (!invoice) {
        invoice = new Invoice()
        let checkIfNumberIsAlreadyInUse = await Database.modelQuery(Invoice).where('invoice_nr', 'like', validateInvoice.invoice_nr.substring(0, 6) + '%')
        if (checkIfNumberIsAlreadyInUse) {
          if (setting.deleted_invoice_nrs?.length > 0)
            changedInvoiceNumber = validateInvoice.invoice_nr.length > 6 ? setting.deleted_invoice_nrs[0].substring(0, 6) + validateInvoice.invoice_nr.substring(6) : setting.deleted_invoice_nrs[0].substring(0, 6)
          else
            changedInvoiceNumber = validateInvoice.invoice_nr.length > 6 ? setting.invoice_nr + validateInvoice.invoice_nr.substring(6) : setting.invoice_nr.toString()
        }
      }

      invoice.invoice_nr = changedInvoiceNumber ? changedInvoiceNumber : validateInvoice.invoice_nr
      invoice.name = validateInvoice.name
      invoice.address = validateInvoice.address
      invoice.zip = validateInvoice.zip
      invoice.city = validateInvoice.city
      invoice.country = validateInvoice.country
      invoice.email = validateInvoice.email
      invoice.date = DateTime.fromISO(<string>validateInvoice.date.toISODate())
      invoice.payment_type = validateInvoice.payment_type
      if (validateInvoice.total_amount !== undefined)
        invoice.total_amount = validateInvoice.total_amount
      if (validateInvoice.stay_amount !== undefined)
        invoice.stay_amount = validateInvoice.stay_amount
      if (validateInvoice.stay_start !== undefined)
        invoice.stay_start = DateTime.fromISO(<string>validateInvoice.stay_start.toISODate())
      if (validateInvoice.stay_end !== undefined)
        invoice.stay_end = DateTime.fromISO(<string>validateInvoice.stay_end.toISODate())
      if (validateInvoice.membership_amount !== undefined)
        invoice.membership_amount = validateInvoice.membership_amount
      if (validateInvoice.meals_amount !== undefined)
        invoice.meals_amount = validateInvoice.meals_amount
      if (validateInvoice.custom_amount !== undefined)
        invoice.custom_amount = validateInvoice.custom_amount
      if (validateInvoice.custom_label !== undefined)
        invoice.custom_label = validateInvoice.custom_label
      if (validateInvoice.date_paid !== undefined)
        invoice.date_paid = DateTime.fromISO(<string>validateInvoice.date_paid.toISODate())
      await invoice.save()

      if (validateInvoice.booking_id !== undefined) {
        const booking = await Booking.findOrFail(validateInvoice.booking_id)
        booking.invoice_id = invoice.id
        booking.invoice_nr = invoice.invoice_nr
        await booking.save()
      }

      const fileName = invoice.invoice_nr + '_' + _.snakeCase(invoice.name) + '_' + invoice.date.toISODate() + '.pdf'
      const retVal: any = await this.generateInvoicePDF(invoice.id, fileName, true)

      const delInvoIndex = setting.deleted_invoice_nrs?.findIndex(n => n.startsWith(invoice.invoice_nr.substring(0, 6)))
      if (delInvoIndex >= 0) {
        setting.deleted_invoice_nrs.splice(delInvoIndex, 1)
        await setting.save()
      } else if (Number(invoice.invoice_nr.substring(0,6)) === setting.invoice_nr) {
        setting.invoice_nr++
        await setting.save()
      }

      return response.ok(retVal)

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async update ({ params, request, response }: HttpContextContract) {

    if (params.id) {

      const validationSchema = schema.create({
        invoice_nr: schema.string(),
        booking_id: schema.number.optional(),
        name: schema.string(),
        address: schema.string(),
        zip: schema.string(),
        city: schema.string(),
        country: schema.string(),
        email: schema.string({ trim: true }, [
          rules.email(),
        ]),
        date: schema.date(),
        total_amount: schema.number.optional(),
        stay_amount: schema.number.optional(),
        stay_start: schema.date.optional(),
        stay_end: schema.date.optional(),
        membership_amount: schema.number.optional(),
        meals_amount: schema.number.optional(),
        custom_amount: schema.number.optional(),
        custom_label: schema.string.optional(),
        payment_type: schema.string(),
        date_paid: schema.date.optional()
      })

      try {

        const requestBody = request.toJSON().body

        const validateInvoice = await request.validate({
          schema: validationSchema,
        })

        const invoice = await Invoice.findOrFail(params.id)
        let prevFileName = invoice.invoice_nr + '_' + _.snakeCase(invoice.name) + '_' + invoice.date.toISODate() + '.pdf'
        const invoiceYear = invoice.date.year
        invoice.invoice_nr = validateInvoice.invoice_nr
        invoice.name = validateInvoice.name
        invoice.address = validateInvoice.address
        invoice.zip = validateInvoice.zip
        invoice.city = validateInvoice.city
        invoice.country = validateInvoice.country
        invoice.email = validateInvoice.email
        invoice.date = DateTime.fromISO(<string>validateInvoice.date.toISODate())
        invoice.payment_type = validateInvoice.payment_type
        if (validateInvoice.total_amount !== undefined)
          invoice.total_amount = validateInvoice.total_amount
        if (validateInvoice.stay_amount !== undefined)
          invoice.stay_amount = validateInvoice.stay_amount
        if (validateInvoice.stay_start !== undefined)
          invoice.stay_start = DateTime.fromISO(<string>validateInvoice.stay_start.toISODate())
        if (validateInvoice.stay_end !== undefined)
          invoice.stay_end = DateTime.fromISO(<string>validateInvoice.stay_end.toISODate())
        if (validateInvoice.membership_amount !== undefined)
          invoice.membership_amount = validateInvoice.membership_amount
        if (validateInvoice.meals_amount !== undefined)
          invoice.meals_amount = validateInvoice.meals_amount
        if (validateInvoice.custom_amount !== undefined)
          invoice.custom_amount = validateInvoice.custom_amount
        if (validateInvoice.custom_label !== undefined || requestBody.custom_label !== undefined)
          invoice.custom_label = validateInvoice.custom_label !== undefined ? validateInvoice.custom_label : ''
        if (validateInvoice.date_paid !== undefined)
          invoice.date_paid = DateTime.fromISO(<string>validateInvoice.date_paid.toISODate())
        if (requestBody.date_paid !== undefined && requestBody.date_paid === null)
          invoice.date_paid = null

        let updatedFileName = invoice.invoice_nr + '_' + _.snakeCase(invoice.name) + '_' + invoice.date.toISODate() + '.pdf'
        if (invoice.pdf_path !== null && invoice.pdf_path !== 'invoices/inv.' + updatedFileName) {
          fs.rm('data/'+invoice.pdf_path, (err) => console.error(err))
          invoice.pdf_path = null
          await Dropbox.deleteInvoice(prevFileName, invoiceYear)
        }
        await invoice.save()

        let retVal: any = await this.generateInvoicePDF(invoice.id, updatedFileName, JSON.parse(params.email.toLowerCase()))

        const setting = await Setting.findOrFail(1)
        if (Number(invoice.invoice_nr.substring(0,6)) === setting.invoice_nr) {
          setting.invoice_nr++
          await setting.save()
        }

        return response.ok(retVal)

      } catch (error) {
        return response.badRequest(error.messages)
      }

    } else {
      return response.badRequest('Invoice ID required')
    }
  }

  public async show ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        const invoice = await Invoice.findOrFail(params.id)
        return response.json(invoice)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Invoice ID required')
    }
  }

  public async showByName ({ request, response }: HttpContextContract) {

    try {
      const name = request.input('name')
      const invoices = await Database.modelQuery(Invoice).where('name', '=', name).orderBy('id', 'desc')
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async showByNumber ({ request, response }: HttpContextContract) {

    try {
      const invoice_nr = request.input('invoice_nr')
      const invoices = await Database.modelQuery(Invoice).where('invoice_nr', '=', invoice_nr).orderBy('invoice_nr', 'desc')
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async list ({ response }: HttpContextContract) {

    try {
      let invoices = await Database.rawQuery('SELECT name, MAX(id) FROM invoices GROUP BY name ORDER BY MAX(id) DESC')
      invoices = invoices[0].map(b => b.name)
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listSelected ({ request, response }: HttpContextContract) {
    try {
      const array = request.input('array', [])

      const invoices = await Database.modelQuery(Invoice).whereIn('invoice_nr', array)
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listBankRun ({ response }: HttpContextContract) {

    try {
      let invoices = await Database.modelQuery(Invoice).whereNull('date_deposited')
        .andWhere((query) => query
          .where('payment_type', '=', 'cash').orWhere('payment_type', '=', 'cheque'))
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listInvoiceNumbers ({ response }: HttpContextContract) {

    try {
      let invoices = await Database.rawQuery('SELECT invoice_nr, payment_type, date_deposited FROM invoices')
      let returnVal: any = {}
      returnVal.all = invoices[0].map(i => i.invoice_nr)
      returnVal.bankrun = invoices[0].filter(i => i.date_deposited === null && (i.payment_type === 'cash' || i.payment_type === 'cheque')).map(i => i.invoice_nr)
      returnVal.reconciliation = invoices[0].filter(i => i.payment_type === 'transfer' || i.payment_type === 'cheque').map(i => i.invoice_nr)
      return response.json(returnVal)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listInvoiceCashNumbers ({ response }: HttpContextContract) {

    try {
      let invoices = await Database.rawQuery('SELECT invoice_nr FROM invoices WHERE payment_type = \"cash\"')
      invoices = invoices[0].map(b => b.invoice_nr)
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async paginatedList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)

      const invoices = await Database.modelQuery(Invoice).where('id', '>', 0).orderBy('id', 'desc').paginate(page, limit)
      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async reconciliationList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)
      const invoice_nr = request.input('invoice_nr')
      const name = request.input('name')
      const filter = request.input('filter')
      const orderBy = request.input('orderBy')

      const invoices = await Database
        .modelQuery(Invoice)
        .where('payment_type', '!=', 'cash')
        .if(invoice_nr, (query) => {
          query.where('invoice_nr', '=', invoice_nr)
        })
        .if(name, (query) => {
          query.where('name', '=', name)
        })
        .if(filter && Object.keys(filter).length, (query) => {

            // date range
            query.if(filter.date && filter.date.length === 2, (query) => query.where('date', '<=', filter.date[1]).andWhere('date', '>=', filter.date[0]))

              // paid
              .if(filter.paid !== undefined, (filterQuery) => {
                if (filter.paid)
                  filterQuery.whereNotNull('date_paid')
                else
                  filterQuery.whereNull('date_paid')
              })

          },
          (query) => {query.where('id', '>', 0)})
        .if(orderBy,
          (query) => {
            query.orderBy(orderBy.key, orderBy.order)},
          (query) => {query.orderBy('invoice_nr', 'desc')})
        .paginate(page, limit)

      return response.json(invoices)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async delete ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {

        const invoice = await Invoice.findOrFail(params.id)
        const invoiceNr = invoice.invoice_nr
        if (invoice !== null) {
          if (invoice.pdf_path !== null)
            fs.rm('data/' + invoice.pdf_path, (err) => console.error(err))
          await invoice.delete()
        }

        const booking = await Booking.findBy('invoice_id', params.id)
        if (booking !== null) {
          booking.invoice_id = null
          booking.invoice_nr = ''
          await booking.save()
        }

        if (invoice.invoice_nr.startsWith(DateTime.now().year.toString().substring(2))) {
          const settings = await Setting.findOrFail(1)
          if (settings !== null && !settings.deleted_invoice_nrs?.includes(invoiceNr)) {
            settings.deleted_invoice_nrs?.push(invoiceNr)
            await settings.save()
          }
        }

        return response.ok(params.id)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Invoice ID required')
    }
  }

  private async generateInvoicePDF(id : Number, fileName: string, doMail: boolean) {

    const invoice = await Invoice.findOrFail(id)
    const settings = await Setting.findOrFail(1)

    const PDFDocument = require('pdfkit')
    const doc = new PDFDocument({
      size: 'A4'
    })

    const filePath = 'invoices/inv.' + fileName
    const absFilePath = Application.publicPath(filePath)

    const stream = fs.createWriteStream(absFilePath)
    doc.pipe(stream)

    doc.registerFont('HelveticaNeue', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue')
    doc.registerFont('HelveticaNeue-Bold', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue-Bold')
    doc.registerFont('HelveticaNeue-Thin', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue-Thin')
    doc.registerFont('HelveticaNeue-ThinItalic', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue-ThinItalic')

    // A4: [595.28, 841.89]

    doc.image(Application.publicPath('static/roundtable_logo.png'), 85, 85, {width: 80})

    if (invoice.payment_type !== 'transfer' || invoice.date_paid) {
      const fillColor = invoice.date_paid ? 'forestgreen' : 'lightgray'
      const paymentTypeText = invoice.date_paid ? 'Received: ' + invoice.date_paid.toFormat('dd.L.yyyy') :
        invoice.payment_type === 'cheque' ? 'Issued: ' + invoice.date.toFormat('dd.L.yyyy') : 'Awaiting payment'

      doc.rotate(5, {origin: [320, 60]})
        .rect(320, 60, 140, 60)
        .lineWidth(10)
        .stroke(fillColor)
        .font('HelveticaNeue-Bold')
        .fontSize(17)
        .fill(fillColor)
        .text(invoice.payment_type.toUpperCase(), 320, 71, {width: 140, align: 'center'})
        .moveDown(0.15)
        .fontSize(10)
        .text(paymentTypeText, {width: 140, align: 'center'})
        .rotate(-5, {origin: [320, 60]})
        .stroke('black')
        .fill('black')
    }

    doc.font('HelveticaNeue')
      .fontSize(10)
      .text('15 Rue Haute', 85, 175)
      .moveDown(0.15)
      .text('F-02820 Saint Erme Outre et Ramecourt')
      .moveDown(0.25)
      .font('HelveticaNeue-Thin')
      .text('contact@pa-f.net', { link: 'mailto:contact@pa-f.net' })
      .moveDown(0.25)
      .font('HelveticaNeue')
      .text('Association Loi 1901')
      .moveDown(0.15)
      .text('SIRET: 499 353 001 000 13')

    doc.font('HelveticaNeue')
      .fontSize(10)
      .text(invoice.date.toFormat('dd. LLLL yyyy'), 410, 175, {width: 100, align: 'right'})

    doc.font('HelveticaNeue-Bold')
      .fontSize(17)
      .text('Contribution No. ' + invoice.invoice_nr, 0, 290, {width: 595, align: 'center'})

    doc.font('HelveticaNeue')
      .fontSize(12)
      .text(invoice.name, 85, 360)
      .moveDown(0.2)
      .font('HelveticaNeue-Thin')
      .text(invoice.address)
      .moveDown(0.08)
      .text(invoice.zip + ' ' + invoice.city)
      .moveDown(0.08)
      .text(invoice.country)

    doc.font('HelveticaNeue-Thin')
      .fontSize(10)
      .text((invoice.stay_start !== null && invoice.stay_end !== null && invoice.stay_amount > 0 ? settings.text_stay + ' ' + invoice.stay_start.toFormat('dd.LL.yyyy') + ' à ' + invoice.stay_end.toFormat('dd.LL.yyyy') : ''), 85, 480)
      .moveDown(invoice.stay_start !== null && invoice.stay_end !== null && invoice.stay_amount > 0 ? 0.3 : 0)
      .text(invoice.meals_amount > 0 ? settings.text_meals : '')
      .moveDown(invoice.meals_amount > 0 ? 0.3 : 0)
      .text(invoice.membership_amount > 0 ? settings.text_membership : '')
      .moveDown(invoice.membership_amount > 0 ? 0.3 : 0)
      .text((invoice.custom_amount > 0 && invoice.custom_label !== null && invoice.custom_label !== '' ? invoice.custom_label : ''), {width: 390, align: 'left'})

    doc.font('HelveticaNeue')
      .fontSize(10)
      .text((invoice.stay_start !== null && invoice.stay_end !== null && invoice.stay_amount > 0 ? (invoice.stay_amount + ' €') : ''), 410, 480, {width: 100, align: 'right'})
      .moveDown(invoice.stay_start !== null && invoice.stay_end !== null && invoice.stay_amount > 0 ? 0.32 : 0)
      .text((invoice.meals_amount > 0 ? invoice.meals_amount + ' €' : ''), {width: 100, align: 'right'})
      .moveDown(invoice.meals_amount > 0 ? 0.32 : 0)
      .text((invoice.membership_amount > 0 ? invoice.membership_amount + ' €' : ''), {width: 100, align: 'right'})
      .moveDown(invoice.membership_amount > 0 ? 0.32 : 0)
      .text((invoice.custom_amount > 0 && invoice.custom_label !== null && invoice.custom_label !== '' ? invoice.custom_amount + ' €' : ''), {width: 100, align: 'right'})

    doc.moveTo(85, 545)
      .lineWidth(0.5)
      .lineTo(510, 545)
      .stroke()

    doc.font('HelveticaNeue-Bold')
      .fontSize(17)
      .text('TOTAL', 85, 555)

    doc.font('HelveticaNeue-Bold')
      .fontSize(17)
      .text('€ ' + (invoice.total_amount), 410, 555, {width: 100, align: 'right'})

    doc.moveTo(85, 579)
      .lineTo(510, 579)
      .stroke()
      .moveTo(85, 581)
      .lineTo(510, 581)
      .stroke()

    doc.font('Courier')
      .fontSize(7)
      .text('Association PAF\nIBAN: FR76 10206 00016 98334988746 51\nBIC:  AGRIFRPP802', 85, 730)
      .text('Crédit Agricole Nord-Est\n25 Rue Libergier\n51088 Reims Cedex - France', 310, 730, {width: 200, align: 'right'})

    doc.end()

    try {
      await new Promise<void>(resolve => {
        stream.on("finish", function () {
          resolve()
        })
      })
    } catch (e) {
      console.error(e)
    }

    invoice.pdf_path = filePath
    await invoice.save()

    await Dropbox.upload('invoices', absFilePath, fileName, invoice.date.year)
    let mailSuccess = false

    if (doMail) {
      try {
        await Mail.sendLater((message) => {
          message
            .from('booking@mailer.pa-f.net', 'PAF booking')
            .to(invoice.email)
            .replyTo('contact@pa-f.net')
            .subject('Your PAF invoice')
            .htmlView('emails/invoice', {name: invoice.name, invoice_nr: invoice.invoice_nr, transfer: invoice.payment_type === 'transfer'})
            .attach(Application.publicPath(filePath), {})
        })
        mailSuccess = true
      } catch (e) {
        console.error('generateInvoicePDF: ' + e)
      }
    }

    return {
      id: invoice.id,
      number: invoice.invoice_nr,
      mail: mailSuccess
    }
  }
}
