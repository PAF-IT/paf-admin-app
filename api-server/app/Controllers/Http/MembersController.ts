import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext'
import {rules, schema} from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Member from 'App/Models/Member'
import _ from 'lodash'
import fs from 'fs'
import {DateTime} from 'luxon'
import Setting from 'App/Models/Setting'
import Application from '@ioc:Adonis/Core/Application'
import Dropbox from 'App/Controllers/Http/Dropbox'
// import MemberOld from 'App/Models/MemberOld'


export default class MembersController {

  public async store ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      start_date: schema.date(),
      name: schema.string(),
      email: schema.string({ trim: true }, [
        rules.email(),
        rules.unique({ table: 'members', column: 'email' }),
      ]),
      address: schema.string(),
      zip: schema.string(),
      city: schema.string(),
      country: schema.string(),
      newsletter: schema.boolean.optional(),
      sci_member: schema.boolean.optional(),
      sci_days_used: schema.number.optional(),
      signature: schema.string()
    })

    try {

      const validateMember = await request.validate({
        schema: validationSchema,
      })

      const member = new Member()
      member.start_date = DateTime.fromISO(<string>validateMember.start_date.toISODate())
      member.renew_date = DateTime.fromISO(<string>validateMember.start_date.plus({year: 1}).toISODate())
      member.name = validateMember.name
      member.email = validateMember.email
      member.address = validateMember.address
      member.zip = validateMember.zip
      member.city = validateMember.city
      member.country = validateMember.country
      if (validateMember.newsletter !== undefined)
        member.newsletter = validateMember.newsletter
      if (validateMember.sci_member !== undefined)
        member.sci_member = validateMember.sci_member
      if (validateMember.sci_days_used !== undefined)
        member.sci_days_used = validateMember.sci_days_used

      const file_path = await this.generateMembershipPDF(member, validateMember.signature)
      if (file_path)
        member.pdf_path = file_path

      await member.save()

      return response.ok(member.id)

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async update ({ params, request, response }: HttpContextContract) {

    if (params.id) {

      const validationSchema = schema.create({
        renew_date: schema.date.optional(),
        name: schema.string.optional(),
        email: schema.string.optional({ trim: true }, [
          rules.email()
        ]),
        address: schema.string.optional(),
        zip: schema.string.optional(),
        city: schema.string.optional(),
        country: schema.string.optional(),
        newsletter: schema.boolean.optional(),
        sci_member: schema.boolean.optional(),
        sci_days_used: schema.number.optional(),
        sci_days_used_prev_year: schema.number.optional(),
        signature: schema.string.optional()
      })

      try {

        const validateMember = await request.validate({
          schema: validationSchema,
        })

        const member = await Member.findOrFail(params.id)

        if (validateMember.renew_date !== undefined)
          member.renew_date = DateTime.fromISO(<string>validateMember.renew_date.toISODate())
        if (validateMember.name !== undefined)
          member.name = validateMember.name
        if (validateMember.email !== undefined)
          member.email = validateMember.email
        if (validateMember.address !== undefined)
          member.address = validateMember.address
        if (validateMember.zip !== undefined)
          member.zip = validateMember.zip
        if (validateMember.city !== undefined)
          member.city = validateMember.city
        if (validateMember.country !== undefined)
          member.country = validateMember.country
        if (validateMember.newsletter !== undefined)
          member.newsletter = validateMember.newsletter
        if (validateMember.sci_member !== undefined)
          member.sci_member = validateMember.sci_member
        if (validateMember.sci_days_used !== undefined)
          member.sci_days_used = validateMember.sci_days_used
        if (validateMember.sci_days_used_prev_year !== undefined)
          member.sci_days_used_prev_year = validateMember.sci_days_used_prev_year

        if (validateMember.signature !== undefined) {
          const file_path = await this.generateMembershipPDF(member, validateMember.signature)
          if (file_path)
            member.pdf_path = file_path
        }
        await member.save()

        // adjust future bookings for this member to update amounts for renewed membership (membership_amount, total_amount)
        // and remaining SCI days (stay_amount, total_amount)

        /*const checkBookingUpdateMembership = validateMember.renew_date !== undefined && member.renew_date < DateTime.fromISO(validateMember.renew_date.toISODate())
        const checkBookingUpdateSci = member.sci_member && member.sci_days_used !== null && validateMember.sci_days_used !== undefined && member.sci_days_used > validateMember.sci_days_used

        if (checkBookingUpdateMembership || checkBookingUpdateSci) {
          const settings = await Setting.findOrFail(1)
          const bookings = await Database.modelQuery(Booking)
            .where('member_id', '=', member.id)
            .andWhere('paid', '=', 0)
            .andWhere('arrival', '>', DateTime.now().toSQLDate())
            .orderBy('arrival', 'asc')
          let sciDaysLeft = member.sci_member !== null && member.sci_member && member.sci_days_used !== null  ? settings.sci_days - member.sci_days_used : 0
          for (const booking of bookings) {
            if (checkBookingUpdateMembership && booking.departure < member.renew_date) {
              booking.membership_count = booking.membership_count > 0 ? booking.membership_count-- : 0
              booking.membership_amount = booking.membership_count * settings.price_membership
              booking.total_amount = booking.stay_amount + booking.membership_amount + booking.meals_amount
            }
            if (checkBookingUpdateSci && booking.arrival.year === DateTime.now().year) {
              let sciNights = booking.stay_days <= sciDaysLeft ? booking.stay_days : sciDaysLeft
              booking.stay_amount = (booking.stay_days - sciNights) * (booking.stay_days > settings.short_stay_duration ? settings.price_stay : settings.price_stay_short)
              booking.total_amount = booking.stay_amount + booking.membership_amount + booking.meals_amount
              sciDaysLeft -= sciNights
            }
            await booking.save()
          }
        }*/

        return response.ok(member.id)

      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Member ID required')
    }
  }

  public async show ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        let member = await Member.findOrFail(params.id)
        if (member.sci_member && await this.checkForSciDaysReset())
          member = await Member.findOrFail(params.id)
        return response.json(member)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Member ID required')
    }
  }

  public async showByEmail ({ request, response }: HttpContextContract) {

    try {
      const email = request.input('email')
      const members = await Database.modelQuery(Member).where('email', '=', email)
      return response.json(members)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async showByName ({ request, response }: HttpContextContract) {

    try {
      const name = request.input('name')
      const members = await Database.modelQuery(Member).where('name', '=', name)
      return response.json(members)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async list ({ response }: HttpContextContract) {

    try {
      let members = await Database.rawQuery('SELECT name FROM members ORDER BY name ASC')
      members = members[0].map(b => b.name)
      return response.json(members)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listSci ({ response }: HttpContextContract) {

    try {
      await this.checkForSciDaysReset()
      const sciMembers = await Database.modelQuery(Member).where('sci_member', '=', 1).orderBy('name', 'asc')
      return response.json(sciMembers)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listMemberEmails ({ response }: HttpContextContract) {

    try {
      let emails = await Database.rawQuery('SELECT email FROM members')
      emails = emails[0].map(b => b.email)
      return response.json(emails)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async listNewsletterEmails ({ request, response }: HttpContextContract) {

    try {
      const fromDate = request.input('date')
      let emails = await Database.rawQuery('SELECT email FROM members WHERE newsletter = 1 AND start_date >= \"' + fromDate + '\"')
      emails = emails[0].map(b => b.email)
      return response.json(emails)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async paginatedList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)

      const members = await Database.modelQuery(Member).where('id', '>', 0).orderBy('renew_date', 'desc').paginate(page, limit)
      return response.json(members)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async checkForSciDaysReset() {

    let returnVal = false

    try {
      const settings = await Setting.findOrFail(1)

      if (settings.last_sci_days_reset < DateTime.now().year) {
        const sciMembers = await Database.modelQuery(Member).where('sci_member', '=', 1)
        for (const member of sciMembers) {
          // @ts-ignore
          member.sci_days_used_prev_year = member.sci_days_used
          // @ts-ignore
          member.sci_days_used = 0
          // @ts-ignore
          await member.save()
        }
        settings.last_sci_days_reset = DateTime.now().year
        await settings.save()
        returnVal = true
      }
    } catch (error) {}

    return returnVal
  }

  public async delete ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {

        const member = await Member.findOrFail(params.id)
        if (member !== null) {
          if (member.pdf_path !== null)
            fs.rm('data/' + member.pdf_path, (err) => console.error(err))
          await member.delete()
        }

        return response.ok(params.id)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Member ID required')
    }
  }

  // public async migrate({ response }: HttpContextContract) {
  //   try {
  //     const members = await Database.connection('mysql_old').modelQuery(MemberOld).where('memberid', '>', 0)
  //     if (members !== null) {
  //       members.forEach(m => {
  //         // console.log('migrating ' + m.memberid + ' start_date: ' + m.startdate)
  //         const member = new Member()
  //         member.id = m.memberid
  //         member.name = m.firstname + ' ' + m.lastname
  //         member.email = m.email
  //         member.address = m.street + ' ' + m.number
  //         member.zip = m.zip
  //         member.city = m.city
  //         member.country = m.country
  //         member.newsletter = m.newsletter
  //         member.start_date = m.startdate
  //         member.renew_date = m.renewdate
  //         member.save()
  //       })
  //     }
  //     response.ok('all done.')
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  private async generateMembershipPDF(member : Member, sigBase64 : string) {

    try {
      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument({
        size: 'A4'
      })
      const fileName = member.renew_date.minus({ year: 1 }).toISODate() + '_' + _.snakeCase(member.name) + '.pdf'
      const filePath = 'members/' + fileName
      const absFilePath = Application.publicPath(filePath)

      const signature = Buffer.from(sigBase64.split(",")[1], 'base64')

      const stream = fs.createWriteStream(absFilePath)
      doc.pipe(stream)

      doc.registerFont('HelveticaNeue', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue')
      doc.registerFont('HelveticaNeue-Bold', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue-Bold')
      doc.registerFont('HelveticaNeue-Thin', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue-Thin')
      doc.registerFont('HelveticaNeue-ThinItalic', Application.publicPath('static/HelveticaNeue.ttc'), 'HelveticaNeue-ThinItalic')

      // A4: [595.28, 841.89]

      doc.image(Application.publicPath('static/roundtable_logo.png'), 85, 85, { width: 80 })

      doc.font('HelveticaNeue')
        .fontSize(10)
        .text('15 Rue Haute', 85, 175)
        .moveDown(0.15)
        .text('F-02820 St Erme Outre et Ramecourt')
        .moveDown(0.15)
        .text('T/F +33 3 23 80 18 46')
        .moveDown(0.25)
        .font('HelveticaNeue-Thin')
        .text('contact@pa-f.net', { link: 'mailto:contact@pa-f.net' })

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

      doc.image(signature, 217, 510, { fit: [160, 100] })

      doc.font('Courier')
        .fontSize(7)
        .text('PAF is a non-profit organization. The Act of 1st July 1901 applies to this organization. PAF is intended to the professionals and not-yet-professionals in the field of performing arts, visual art, music, film, literature, new media, theory and cultural production, who want to research and determine their own conditions of work. It is a platform for anyone who wishes to expand possibilities and interests in their own working practice. Initiated and run by artists, theoreticians, practitioners and activists themselves, PAF is an user-created informal institution. The organization disclaims all liability as long as the necessary restorations of the building are not made. Therefore PAF is not liable in case of any loss, material damage or personal injury occurred to current members and to non-members even in case of gross negligence. You hereby declare to have inspected the site and building. You declare awareness that the aforementioned site and building are not within accordance of the necessary safety codes. To ensure that every resident becomes a member of the organization PAF, they must sign this disclaimer.', 85, 650, {
          width: 425,
          align: 'justify'
        })

      doc.end()
      await new Promise<void>(resolve => {
        stream.on("finish", function () {
          resolve()
        })
      })

      await Dropbox.upload('memberships', absFilePath, fileName, member.renew_date.minus({ year: 1 }).year)

      return filePath

    } catch (e) {
      console.error(e)
    }
  }
}
