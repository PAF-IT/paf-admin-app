// import Application from '@ioc:Adonis/Core/Application'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from "@ioc:Adonis/Core/Validator";
// import Mail from '@ioc:Adonis/Addons/Mail'
import Invoice from 'App/Models/Invoice'
// import InvoicePdf from 'App/Models/InvoicePdf'
import Member from 'App/Models/Member'
// import MemberPdf from 'App/Models/MemberPdf'
import Setting from 'App/Models/Setting'
import * as fs from 'fs'
import _ from 'lodash'
import Application from "@ioc:Adonis/Core/Application";


export default class PDFController {

  /**
    * @swagger
    * /invoice/pdf:
    *   post:
    *     tags:
    *       - Invoice
    *     summary: Create an invoice PDF
    *     requestBody:
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               id:
    *                 type: number
    *               email_to:
    *                 type: string
    *     responses:
    *       200:
    *         description: OK
    *
    */
  public async invoice({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      id: schema.number(),
      email_to: schema.string.optional({ trim: true }, [
        rules.email(),
      ])
    })

    try {

      const validateInput = await request.validate({
        schema: validationSchema,
      })

      const invoice = await Invoice.findOrFail(validateInput.id)
      const settings = await Setting.findOrFail(1)

      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument({
        size: 'A4'
      })

      const filePath = 'invoices/inv.' + invoice.invoice_nr + '_' + _.snakeCase(invoice.name) + '_' + invoice.date.toISODate() + '.pdf'
      const filePathStream = 'data/' + filePath

      const isCustom = !_.isNull(invoice.custom_label)

      doc.pipe(fs.createWriteStream(filePathStream))

      doc.registerFont('HelveticaNeue', 'static/HelveticaNeue.ttc', 'HelveticaNeue')
      doc.registerFont('HelveticaNeue-Bold', 'static/HelveticaNeue.ttc', 'HelveticaNeue-Bold')
      doc.registerFont('HelveticaNeue-Thin', 'static/HelveticaNeue.ttc', 'HelveticaNeue-Thin')
      doc.registerFont('HelveticaNeue-ThinItalic', 'static/HelveticaNeue.ttc', 'HelveticaNeue-ThinItalic')

      // A4: [595.28, 841.89]

      doc.image('static/roundtable_logo.png', 85, 85, { width: 80 })

      doc.font('HelveticaNeue')
        .fontSize(10)
        .text('15 Rue Haute', 85, 175)
        .moveDown(0.15)
        .text('F-02820 St Erme Outre et Ramecourt')
        .moveDown(0.15)
        .text('T/F +33 3 23 80 18 46')
        .moveDown(0.25)
        .font('HelveticaNeue-Thin')
        .text('contactpaf@gmail.com', { link: 'mailto:contactpaf@gmail.com' })

      doc.font('HelveticaNeue')
        .fontSize(10)
        .text(invoice.date.toFormat('dd. LLLL yyyy'), 410, 175, {
          width: 100,
          align: 'right'
        })

      doc.font('HelveticaNeue-Bold')
        .fontSize(17)
        .text('Contribution No. ' + invoice.invoice_nr, 0, 290, {
          width: 595,
          align: 'center'
        })

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
        .text(isCustom ? ' ' : (_.isNull(invoice.stay_start) || _.isNull(invoice.stay_end) ? ' ' : settings.text_stay + ' ' + invoice.stay_start.toFormat('dd.LL.yyyy') + ' à ' + invoice.stay_end.toFormat('dd.LL.yyyy')), 85, 480)
        .moveDown(0.3)
        .text(isCustom ? ' ' : settings.text_meals)
        .moveDown(0.3)
        .text(isCustom ? invoice.custom_label : settings.text_membership)

      doc.font('HelveticaNeue')
        .fontSize(10)
        .text(isCustom ? ' ' : (invoice.stay_amount > 0 ? '€ ' + invoice.stay_amount : ''), 410, 480, {
          width: 100,
          align: 'right'
        })
        .moveDown(0.32)
        .text(isCustom ? ' ' : (invoice.meals_amount > 0 ? ' € ' + invoice.meals_amount : ''), {
          width: 100,
          align: 'right'
        })
        .moveDown(0.32)
        .text(isCustom ? invoice.custom_amount : (invoice.membership_amount > 0 ? '€ ' + invoice.membership_amount : ''), {
          width: 100,
          align: 'right'
        })

      doc.moveTo(85, 530)
        .lineWidth(0.5)
        .lineTo(510, 530)
        .stroke()

      doc.font('HelveticaNeue-Bold')
        .fontSize(17)
        .text('TOTAL', 85, 540)

      doc.font('HelveticaNeue-Bold')
        .fontSize(17)
        .text('€ ' + (isCustom ? invoice.custom_amount : (invoice.stay_amount + invoice.meals_amount + invoice.membership_amount)), 410, 540, {
          width: 100,
          align: 'right'
        })

      doc.moveTo(85, 564)
        .lineTo(510, 564)
        .stroke()
        .moveTo(85, 566)
        .lineTo(510, 566)
        .stroke()

      doc.font('Courier')
        .fontSize(7)
        .text('Association PAF\nIBAN: FR76 10206 00016 98334988746 51\nBIC:  AGRIFRPP802', 85, 730)
        .text('Crédit Agricole Nord-Est\n25 Rue Libergier\n51088 Reims Cedex - France', 310, 730, {
          width: 200,
          align: 'right'
        })

      doc.end()

      // let invoicePdf = await InvoicePdf.findBy('invoice_nr', invoice.invoice_nr)
      // if (invoicePdf === null || invoicePdf === undefined)
      //   invoicePdf = new InvoicePdf()
      // invoicePdf.invoice_id = invoice.id
      // invoicePdf.invoice_nr = invoice.invoice_nr
      // invoicePdf.name = invoice.name
      // invoicePdf.email = invoice.email
      // invoicePdf.date = invoice.date
      // invoicePdf.file_path = filePath

      invoice.pdf_path = filePath

      if (validateInput.email_to != undefined) {

        console.log("Should send invoice PDF " + invoice.id + " to: " + validateInput.email_to)

        // TODO: implement email
      }

      // await invoicePdf.save()
      await invoice.save()

      // return response.ok(invoicePdf.id)
      return response.ok(invoice.id)

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  /**
    * @swagger
    * /member/pdf:
    *   post:
    *     tags:
    *       - Member
    *     summary: Create a membership PDF
    *     requestBody:
    *       content:
    *         multipart/form-data:
    *           schema:
    *             type: object
    *             properties:
    *               id:
    *                 type: number
    *               email_to:
    *                 type: string
    *               signature:
    *                 type: string
    *                 format: binary
    *     responses:
    *       200:
    *         description: OK
    *
    */
  public async membership({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      id: schema.number(),
      email_to: schema.string.optional({ trim: true }, [
        rules.email()
      ]),
      signature: schema.file({
        size: '1mb',
        extnames: ['jpg', 'gif', 'png']
      })
    })

    try {

      const validateInput = await request.validate({
        schema: validationSchema,
      })

      const member = await Member.findOrFail(validateInput.id)

      const sigFileName = _.snakeCase(member.name) + '.' + validateInput.signature.extname
      const sigPath = Application.tmpPath('uploads') + '/' + sigFileName
      console.log(sigPath)
      await validateInput.signature.move(Application.tmpPath('uploads'), {name: sigFileName})

      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument({
        size: 'A4'
      })
      const filePath = 'members/' + member.renew_date.minus({ year: 1 }).toISODate() + '_' + _.snakeCase(member.name) + '.pdf'
      const filePathStream = 'data/' + filePath

      doc.pipe(fs.createWriteStream(filePathStream))

      doc.registerFont('HelveticaNeue', 'static/HelveticaNeue.ttc', 'HelveticaNeue')
      doc.registerFont('HelveticaNeue-Bold', 'static/HelveticaNeue.ttc', 'HelveticaNeue-Bold')
      doc.registerFont('HelveticaNeue-Thin', 'static/HelveticaNeue.ttc', 'HelveticaNeue-Thin')
      doc.registerFont('HelveticaNeue-ThinItalic', 'static/HelveticaNeue.ttc', 'HelveticaNeue-ThinItalic')

      // A4: [595.28, 841.89]

      doc.image('static/roundtable_logo.png', 85, 85, { width: 80 })

      doc.font('HelveticaNeue')
        .fontSize(10)
        .text('15 Rue Haute', 85, 175)
        .moveDown(0.15)
        .text('F-02820 St Erme Outre et Ramecourt')
        .moveDown(0.15)
        .text('T/F +33 3 23 80 18 46')
        .moveDown(0.25)
        .font('HelveticaNeue-Thin')
        .text('contactpaf@gmail.com', { link: 'mailto:contactpaf@gmail.com' })

      doc.font('HelveticaNeue')
        .fontSize(10)
        .text(member.renew_date.minus({ year: 1 }).toFormat('dd. LLLL yyyy'), 410, 175, {
          width: 100,
          align: 'right'
        })

      doc.font('HelveticaNeue-Bold')
        .fontSize(20)
        .text('PAF Membership', 0, 290, {
          width: 595,
          align: 'center'
        })

      doc.font('HelveticaNeue-ThinItalic')
        .fontSize(14)
        .text('Valid until: ' + member.renew_date.toFormat('dd.LL.yyyy'), 0, 320, {
          width: 595,
          align: 'center'
        })

      doc.font('HelveticaNeue')
        .fontSize(14)
        .text(member.name, 217, 380)
        .moveDown(0.2)
        .font('HelveticaNeue-Thin')
        .text(member.address)
        .moveDown(0.08)
        .text(member.zip + ' ' + member.city)
        .moveDown(0.08)
        .text(member.country)
        .moveDown(0.4)
        .fontSize(10)
        .text(member.email, { link: 'mailto:' + member.email })

      doc.image(sigPath, 217, 510, { fit: [160, 100] })
      // doc.image('data/signature.png', 217, 510, { fit: [160, 100] })

      doc.font('Courier')
        .fontSize(7)
        .text('PAF is a non-profit organization. The Act of 1st July 1901 applies to this organization. PAF is intended to the professionals and not-yet-professionals in the field of performing arts, visual art, music, film, literature, new media, theory and cultural production, who want researching and determining their own conditions of work. It is a platform for anyone who wishes to expand possibilities and interests in his/her own working practice. Initiated and run by artists, theoreticians, practitioners and activists themselves, PAF is an user-created informal institution. The organization disclaims all liability as long as the necessary restorations of the building are not made. Therefore PAF is not liable in case of any loss, material damage or personal injury occurred to current members and to non-members even in case of gross negligence. You hereby declare to have inspected the site and building. You declare awareness that the aforementioned site and building are not within accordance of the necessary safety codes. To ensure that every resident becomes a member of the organization PAF, s/he must sign this disclaimer.', 85, 650, {
          width: 425,
          align: 'justify'
        })

      doc.end()

      // let memberPdf = await MemberPdf.findBy('member_id', member.id)
      // if (memberPdf === null || memberPdf === undefined)
      //   memberPdf = new MemberPdf()
      // memberPdf.member_id = member.id
      // memberPdf.name = member.name
      // memberPdf.email = member.email
      // memberPdf.renew_date = member.renew_date
      // memberPdf.file_path = filePath

      member.pdf_path = filePath

      if (validateInput.email_to != undefined) {

        console.log("Should send membership PDF to: " + validateInput.email_to)

        // TODO: implement email

        // const { url } = await Mail.preview((message) => {
        //   message
        //     .to(validateInput.email_to != undefined ? validateInput.email_to : '')
        //     .from('no-reply@paf-collective.net')
        //     .subject('Your membership')
        //     .htmlView('emails/membership.plain', {})
        // })
        //
        // console.log('Preview url: ' + { url })
      }

      // await memberPdf.save()
      await member.save()

      await fs.unlink(sigPath, (err) => {
        if (err)
          return response.badRequest(err.message)
      });

      // return response.ok(memberPdf.id)
      return response.ok(member.id)

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

}
