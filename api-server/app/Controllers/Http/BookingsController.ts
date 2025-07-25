import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {rules, schema} from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Booking from 'App/Models/Booking'
import { DateTime } from 'luxon'
import Event from 'App/Models/Event'
import Member from 'App/Models/Member'
import Setting from 'App/Models/Setting'
import MattressesController from "App/Controllers/Http/MattressesController";


export default class BookingsController {


  public async store ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      mattress_booking: schema.boolean.optional(),
      name: schema.string(),
      member_id: schema.number.optional(),
      sci_member: schema.boolean.optional(),
      email: schema.string({ trim: true }, [
        rules.email(),
      ]),
      phone: schema.string.optional(),
      city: schema.string.optional(),
      arrival: schema.date(),
      departure: schema.date(),
      people_count: schema.number.optional(),
      membership_count: schema.number.optional(),
      info: schema.string.optional(),
      cancelled: schema.boolean.optional(),
      show_on_website: schema.boolean.optional(),
      paid: schema.boolean.optional(),
      date_paid: schema.date.optional(),
      no_stay_pay: schema.boolean.optional(),
      no_meal_pay: schema.boolean.optional(),
      longstayer: schema.boolean.optional(),
      paf_events: schema.array.nullableAndOptional().members(schema.object().members({
        id: schema.number(),
        name: schema.string(),
        abbreviation: schema.string(),
        confirmed: schema.boolean()
      })),
      group_name: schema.string.optional(),
      stay_days: schema.number.optional(),
      stay_amount: schema.number.optional(),
      membership_amount: schema.number.optional(),
      meals_amount: schema.number.optional(),
      custom_amount: schema.number.optional(),
      total_amount: schema.number.optional(),
      sci_days_used: schema.number.optional(),
      stay_amount_orig: schema.number.optional(),
      membership_amount_orig: schema.number.optional(),
      meals_amount_orig: schema.number.optional(),
      early_pay: schema.boolean.optional(),
      stay_rate: schema.number.optional(),
      institutional: schema.boolean.optional(),
      mattress_donation: schema.number.optional()
    })

    try {

      const validateBooking = await request.validate({
        schema: validationSchema,
      })

      const booking = new Booking()
      if (validateBooking.mattress_booking !== undefined)
        booking.mattress_booking = validateBooking.mattress_booking
      booking.booking_date = DateTime.now()
      booking.name = validateBooking.name
      if (validateBooking.member_id !== undefined)
        booking.member_id = validateBooking.member_id
      if (validateBooking.sci_member !== undefined)
        booking.sci_member = validateBooking.sci_member
      booking.email = validateBooking.email
      if (validateBooking.phone !== undefined)
        booking.phone = validateBooking.phone
      if (validateBooking.city !== undefined)
        booking.city = validateBooking.city
      booking.arrival = DateTime.fromISO(<string>validateBooking.arrival.toISODate())
      booking.departure = DateTime.fromISO(<string>validateBooking.departure.toISODate())
      if (validateBooking.people_count !== undefined)
        booking.people_count = validateBooking.people_count
      if (validateBooking.membership_count !== undefined)
        booking.membership_count = validateBooking.membership_count
      if (validateBooking.info !== undefined)
        booking.info = validateBooking.info
      if (validateBooking.cancelled !== undefined)
        booking.cancelled = validateBooking.cancelled
      if (validateBooking.show_on_website !== undefined)
        booking.show_on_website = validateBooking.show_on_website
      if (validateBooking.paid !== undefined)
        booking.paid = validateBooking.paid
      if (validateBooking.date_paid !== undefined)
        booking.date_paid = DateTime.fromISO(<string>validateBooking.date_paid.toISODate())
      if (validateBooking.no_stay_pay !== undefined)
        booking.no_stay_pay = validateBooking.no_stay_pay
      if (validateBooking.no_meal_pay !== undefined)
        booking.no_meal_pay = validateBooking.no_meal_pay
      if (validateBooking.longstayer !== undefined)
        booking.longstayer = validateBooking.longstayer
      if (validateBooking.paf_events !== undefined)
        booking.paf_events = validateBooking.paf_events
      if (validateBooking.group_name !== undefined)
        booking.group_name = validateBooking.group_name
      if (validateBooking.stay_days !== undefined)
        booking.stay_days = validateBooking.stay_days
      if (validateBooking.stay_amount !== undefined)
        booking.stay_amount = validateBooking.stay_amount
      if (validateBooking.membership_amount !== undefined)
        booking.membership_amount = validateBooking.membership_amount
      if (validateBooking.meals_amount !== undefined)
        booking.meals_amount = validateBooking.meals_amount
      if (validateBooking.custom_amount !== undefined)
        booking.custom_amount = validateBooking.custom_amount
      if (validateBooking.total_amount !== undefined)
        booking.total_amount = validateBooking.total_amount
      if (validateBooking.sci_days_used !== undefined)
        booking.sci_days_used = validateBooking.sci_days_used
      if (validateBooking.stay_amount_orig !== undefined)
        booking.stay_amount_orig = validateBooking.stay_amount_orig
      if (validateBooking.membership_amount_orig !== undefined)
        booking.membership_amount_orig = validateBooking.membership_amount_orig
      if (validateBooking.meals_amount_orig !== undefined)
        booking.meals_amount_orig = validateBooking.meals_amount_orig
      if (validateBooking.early_pay !== undefined)
        booking.early_pay = validateBooking.early_pay
      if (validateBooking.stay_rate !== undefined)
        booking.stay_rate = validateBooking.stay_rate
      if (validateBooking.institutional !== undefined)
        booking.institutional = validateBooking.institutional
      if (validateBooking.mattress_donation !== undefined)
        booking.mattress_donation = validateBooking.mattress_donation

      await booking.save()

      if (booking.paf_events !== undefined && booking.paf_events !== null && booking.paf_events.length > 0) {
        for (const bookedEvent of booking.paf_events) {
          let event = await Event.findOrFail(bookedEvent['id'])
          if (event.bookings === null)
            event.bookings = []
          const eventBooking = {
            id: booking.id,
            count: booking.people_count,
            confirmed: bookedEvent['confirmed']
          }
          event.bookings.push(eventBooking)
          event.bookings.sort((a, b) => a['id'] - b['id'])
          event.participant_count = event.bookings.reduce((pVal, cVal) => pVal + cVal['count'], 0)
          await event.save()
        }
      }

      return response.ok(booking.id)

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async update ({ params, request, response }: HttpContextContract) {

    if (params.id) {

      const validationSchema = schema.create({
        mattress_booking: schema.boolean.optional(),
        name: schema.string(),
        member_id: schema.number.optional(),
        sci_member: schema.boolean.optional(),
        email: schema.string({ trim: true }, [
          rules.email(),
        ]),
        phone: schema.string.optional(),
        city: schema.string.optional(),
        arrival: schema.date(),
        departure: schema.date(),
        people_count: schema.number.optional(),
        membership_count: schema.number.optional(),
        info: schema.string.optional({}, [
          rules.minLength(0)
        ]),
        cancelled: schema.boolean.optional(),
        invoice_id: schema.number.optional(),
        invoice_nr: schema.string.optional(),
        show_on_website: schema.boolean.optional(),
        paid: schema.boolean.optional(),
        date_paid: schema.date.optional(),
        no_stay_pay: schema.boolean.optional(),
        no_meal_pay: schema.boolean.optional(),
        longstayer: schema.boolean.optional(),
        paf_events: schema.array.nullableAndOptional().members(schema.object().members({
          id: schema.number(),
          name: schema.string(),
          abbreviation: schema.string(),
          confirmed: schema.boolean()
        })),
        group_name: schema.string.optional(),
        stay_days: schema.number.optional(),
        stay_amount: schema.number.optional(),
        membership_amount: schema.number.optional(),
        meals_amount: schema.number.optional(),
        custom_amount: schema.number.optional(),
        total_amount: schema.number.optional(),
        sci_days_used: schema.number.optional(),
        stay_amount_orig: schema.number.optional(),
        membership_amount_orig: schema.number.optional(),
        meals_amount_orig: schema.number.optional(),
        early_pay: schema.boolean.optional(),
        stay_rate: schema.number.optional(),
        institutional: schema.boolean.optional(),
        mattress_donation: schema.number.optional()
      })

      try {

        const requestBody = request.toJSON().body

        const validateBooking = await request.validate({
          schema: validationSchema,
        })

        const booking = await Booking.findOrFail(params.id)
        if (validateBooking.mattress_booking !== undefined)
          booking.mattress_booking = validateBooking.mattress_booking
        const prevPaid = booking.paid
        booking.name = validateBooking.name
        if (validateBooking.member_id !== undefined)
          booking.member_id = validateBooking.member_id
        if (validateBooking.sci_member !== undefined)
          booking.sci_member = validateBooking.sci_member
        booking.email = validateBooking.email
        if (validateBooking.phone !== undefined || requestBody.phone !== undefined)
          booking.phone = validateBooking.phone !== undefined ? validateBooking.phone : ''
        if (validateBooking.city !== undefined || requestBody.city !== undefined)
          booking.city = validateBooking.city !== undefined ? validateBooking.city : ''
        booking.arrival = DateTime.fromISO(<string>validateBooking.arrival.toISODate())
        booking.departure = DateTime.fromISO(<string>validateBooking.departure.toISODate())
        if (validateBooking.people_count !== undefined)
          booking.people_count = validateBooking.people_count
        if (validateBooking.membership_count !== undefined)
          booking.membership_count = validateBooking.membership_count
        if (validateBooking.info !== undefined || requestBody.info !== undefined)
          booking.info = validateBooking.info !== undefined ? validateBooking.info : ''
        if (validateBooking.cancelled !== undefined)
          booking.cancelled = validateBooking.cancelled
        if (validateBooking.invoice_id !== undefined)
          booking.invoice_id = validateBooking.invoice_id
        if (validateBooking.invoice_nr !== undefined)
          booking.invoice_nr = validateBooking.invoice_nr
        if (validateBooking.show_on_website !== undefined)
          booking.show_on_website = validateBooking.show_on_website
        if (validateBooking.paid !== undefined)
          booking.paid = validateBooking.paid
        if (validateBooking.date_paid !== undefined)
          booking.date_paid = DateTime.fromISO(<string>validateBooking.date_paid.toISODate())
        if (validateBooking.no_stay_pay !== undefined)
          booking.no_stay_pay = validateBooking.no_stay_pay
        if (validateBooking.no_meal_pay !== undefined)
          booking.no_meal_pay = validateBooking.no_meal_pay
        if (validateBooking.longstayer !== undefined)
          booking.longstayer = validateBooking.longstayer
        if (validateBooking.paf_events !== undefined)
          booking.paf_events = validateBooking.paf_events
        if (validateBooking.group_name !== undefined || requestBody.group_name !== undefined)
          booking.group_name = validateBooking.group_name !== undefined ? validateBooking.group_name : ''
        if (validateBooking.stay_days !== undefined)
          booking.stay_days = validateBooking.stay_days
        if (validateBooking.stay_amount !== undefined)
          booking.stay_amount = validateBooking.stay_amount
        if (validateBooking.membership_amount !== undefined)
          booking.membership_amount = validateBooking.membership_amount
        if (validateBooking.meals_amount !== undefined)
          booking.meals_amount = validateBooking.meals_amount
        if (validateBooking.custom_amount !== undefined)
          booking.custom_amount = validateBooking.custom_amount
        if (validateBooking.total_amount !== undefined)
          booking.total_amount = validateBooking.total_amount
        if (validateBooking.sci_days_used !== undefined)
          booking.sci_days_used = validateBooking.sci_days_used
        if (validateBooking.stay_amount_orig !== undefined)
          booking.stay_amount_orig = validateBooking.stay_amount_orig
        if (validateBooking.membership_amount_orig !== undefined)
          booking.membership_amount_orig = validateBooking.membership_amount_orig
        if (validateBooking.meals_amount_orig !== undefined)
          booking.meals_amount_orig = validateBooking.meals_amount_orig
        if (validateBooking.early_pay !== undefined)
          booking.early_pay = validateBooking.early_pay
        if (validateBooking.stay_rate !== undefined)
          booking.stay_rate = validateBooking.stay_rate
        if (validateBooking.institutional !== undefined)
          booking.institutional = validateBooking.institutional
        if (validateBooking.mattress_donation !== undefined)
          booking.mattress_donation = validateBooking.mattress_donation

        let events = await Event.all()
        if (events !== null) {
          for (let event of events) {
            if (event.bookings !== null && event.bookings.length > 0) {
              const existingBookingIndex = event.bookings.findIndex(b => b['id'] === booking.id)
              if (existingBookingIndex > -1) {
                event.bookings.splice(existingBookingIndex, 1)
                event.participant_count = event.bookings.reduce((pVal, cVal) => pVal + cVal['count'], 0)
                await event.save()
              }
            }
            if (!booking.cancelled && booking.paf_events !== undefined && booking.paf_events !== null && booking.paf_events.length > 0) {
              for (const bookedEvent of booking.paf_events) {
                if (event.id === bookedEvent['id']) {
                  if (event.bookings === null)
                    event.bookings = []
                  const eventBooking = {
                    id: booking.id,
                    count: booking.people_count,
                    confirmed: bookedEvent['confirmed']
                  }
                  event.bookings.push(eventBooking)
                  event.bookings.sort((a, b) => a['id'] - b['id'])
                  event.participant_count = event.bookings.reduce((pVal, cVal) => pVal + cVal['count'], 0)
                  await event.save()
                }
              }
            }
          }
        }

        if (!booking.paid && prevPaid && booking.sci_days_used !== null && booking.sci_days_used > 0) {
          let member = await Member.findOrFail(booking.member_id)
          if (member.sci_member)
            member.sci_days_used -= booking.sci_days_used
          await member.save()
          booking.sci_days_used = 0
        }

        if (!prevPaid && booking.paid) {

          const settings = await Setting.findOrFail(1)
          if (!booking.institutional && booking.stay_days !== undefined && booking.stay_days !== null && booking.stay_rate !== undefined && booking.stay_rate !== null && booking.stay_rate > 0) {
            const stayRate = booking.stay_days <= settings.short_stay_duration ? settings.price_stay_short : booking.stay_days < 30 ? settings.price_stay : settings.price_stay_month
            if (booking.stay_rate > stayRate) {
              const mattressCut = booking.stay_amount - (booking.stay_days - booking.sci_days_used) * stayRate
              if (mattressCut > 0)
                await MattressesController.createTransaction('system', 'credit', 'stay', booking.name, '', booking.id, booking.stay_days, mattressCut)
            }
          }
          const peopleCount = booking.people_count !== null ? booking.people_count : 1
          if (booking.membership_amount > 0 && !booking.mattress_booking) {
            const mattressCut = booking.membership_amount - peopleCount * (settings.price_membership - settings.mattress_membership)
            if (mattressCut > 0)
              await MattressesController.createTransaction('system', 'credit', 'membership', booking.name, '', booking.id, null, mattressCut)
          }
          // if (booking.mattress_donation !== undefined && booking.mattress_donation !== null && booking.mattress_donation > 0)
          //   await MattressesController.createTransaction('credit', 'donation', booking.name, booking.mattress_donation)
        }

        await booking.save()

        return response.ok(booking.id)

      } catch (error) {
        return response.badRequest(error.messages)
      }

    } else {
      return response.badRequest('Booking ID required')
    }
  }

  public async updatePaidDate({request, response}: HttpContextContract) {

    const validationSchema = schema.create({
      date_paid: schema.date(),
      invoice_id: schema.number()
    })

    try {

      const validateBooking = await request.validate({
        schema: validationSchema,
      })

      const booking: any = await Database.modelQuery(Booking).where('invoice_id', '=', validateBooking.invoice_id).first()
      if (booking !== null) {
        booking.date_paid = DateTime.fromISO(<string>validateBooking.date_paid.toISODate())
        await booking.save()
        return response.ok(booking.id)
      }
      return response.ok('booking not found')
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async show ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        const booking = await Booking.findOrFail(params.id)
        return response.json(booking)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Booking ID required')
    }
  }

  public async showByIds ({ request, response }: HttpContextContract) {

    try {
      let hadWhere = false
      let queryString = 'SELECT * FROM bookings WHERE'
      request.input('ids').forEach(id => {
        queryString = queryString.concat(hadWhere ? ' OR' : '').concat(' id=').concat(id)
        hadWhere = true
      })
      if (queryString.includes('id')) {
        queryString = queryString.concat(' ORDER BY booking_date ASC')
        const bookings = await Database.rawQuery(queryString)
        return response.json(bookings[0])
      } else
        return response.badRequest('no ids in request')
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async showByName ({ request, response }: HttpContextContract) {

    try {
      const name = request.input('name')
      const bookings = await Database.modelQuery(Booking).where('name', '=', name).orderBy('id', 'desc')
      return response.json(bookings)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async list ({ response }: HttpContextContract) {

    try {
      let bookings = await Database.rawQuery('SELECT name, MAX(arrival) FROM bookings GROUP BY name ORDER BY MAX(arrival) DESC')
      bookings = bookings[0].map(b => b.name)
      return response.json(bookings)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async reservations ({ params, response }: HttpContextContract) {

    try {
      let bookings: any[] = []
      let result: any = {}
      let year = params.year && params.year.length === 4 ? params.year : DateTime.now().year
      bookings = await Database.rawQuery('SELECT name, people_count, arrival, departure, group_name, paf_events FROM bookings WHERE cancelled = 0 AND show_on_website = 1 AND arrival >= \'' + year + '-01-01\' AND arrival <= \'' + year + '-12-31\' ORDER BY arrival ASC')
      bookings = bookings[0].filter(b => b.paf_events === null || b.paf_events === '[]' || JSON.parse(b.paf_events).find(e => e.confirmed))
      bookings = bookings.map(b => b.name + (b.people_count > 1 ? ' (' + b.people_count + ' people)' : '') + ', '
        + DateTime.fromISO(b.arrival).toFormat('d/M') + '-' + DateTime.fromISO(b.departure).toFormat('d/M')
        + (b.group_name !== null && b.group_name !== '' ? ' (' + b.group_name + ')' : '')
        + (b.paf_events !== null && b.paf_events !== '[]' ? ' (' + JSON.parse(b.paf_events).map(e => e.confirmed ? e.abbreviation : e.abbreviation + ' [tbc]').join(', ')  + ')'  : ''))
      result = {
        year: year,
        data: bookings
      }
      return response.json(result)
    } catch (error) {
      console.error(error)
      return response.badRequest(error.messages)
    }
  }

  public async listGroups ({ response }: HttpContextContract) {

    try {
      let bookings = await Database.rawQuery('SELECT group_name, MAX(arrival) FROM bookings GROUP BY group_name ORDER BY MAX(arrival) DESC')
      bookings = bookings[0].map(b => b.group_name)
      return response.json(bookings)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async paginatedList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)
      const name = request.input('name')
      const filter = request.input('filter')
      const orderBy = request.input('orderBy')

      const bookings = await Database
        .modelQuery(Booking)
        .if(name, (query) => {
          query.where('name', '=', name)
        })
        .if(filter && Object.keys(filter).length, (query) => {query

            // arriving at date
            .if(filter.arrival && filter.arrival.length === 1, (filterQuery) => {filterQuery.where('arrival', '=', filter.arrival[0])})

            // arriving during date range
            .if(filter.arrival && filter.arrival.length === 2, (filterQuery) => {filterQuery.where('arrival', '<=', filter.arrival[1]).andWhere('arrival', '>=', filter.arrival[0])})

            // present at date
            .if(filter.present && filter.present.length === 1, (filterQuery) => {filterQuery.where('arrival', '<=', filter.present[0]).andWhere('departure', '>', filter.present[0])})

            // present during date range
            .if(filter.present && filter.present.length === 2, (filterQuery) => {filterQuery.where('arrival', '<=', filter.present[1]).andWhere('departure', '>', filter.present[0])})

            // event
            .if(filter.event, (filterQuery) => {filterQuery.whereRaw('(LOCATE("\\"id\\": ' + filter.event + ',", paf_events) > 0 OR LOCATE("\\"id\\":' + filter.event + ',", paf_events) > 0)')})

            // group
            .if(filter.group, (filterQuery) => {filterQuery.where('group_name', '=', filter.group)})

            // cancelled
            .if(filter.cancelled !== undefined, (filterQuery) => {filterQuery.where('cancelled', '=', (filter.cancelled ? 1 : 0))})

            // paid
            .if(filter.paid !== undefined, (filterQuery) => {filterQuery.where('paid', '=', (filter.paid ? 1 : 0))})

            // longstayer
            .if(filter.longstayer !== undefined, (filterQuery) => {filterQuery.where('longstayer', '=', (filter.longstayer ? 1 : 0))})
          },
          (query) => {query.where('id', '>', 0)})
        .if(orderBy,
          (query) => {query.orderBy(orderBy.key, orderBy.order)},
          (query) => {query.orderBy('id', 'desc')})
        .paginate(page, limit)

      return response.json(bookings)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async paginatedPaymentList ({ request, response }: HttpContextContract) {

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)
      const name = request.input('name')
      const filter = request.input('filter')
      const orderBy = request.input('orderBy')

      const bookings = await Database
        .modelQuery(Booking)
        .where('cancelled', '=', 0)
        .if(name, (query) => {
          query.where('name', '=', name)
        })
        .if(filter && Object.keys(filter).length, (query) => {query

            // arriving during date range, or early_pay
            .if(filter.arrival && filter.arrival.length === 2, (filterQuery) => {filterQuery
              .where((query) => query
                .where('early_pay', '=', 1)
                .orWhere((query) => query
                  .where('arrival', '<=', filter.arrival[1]).andWhere('arrival', '>=', filter.arrival[0]))
              )})

            // paid
            .if(filter.paid !== undefined, (filterQuery) => {filterQuery.where('paid', '=', (filter.paid ? 1 : 0))})
          },
          (query) => {query.where('id', '>', 0)})
        .if(orderBy,
          (query) => {query.orderBy(orderBy.key, orderBy.order)},
          (query) => {query.orderBy('id', 'desc')})
        .paginate(page, limit)

      return response.json(bookings)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async delete ({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        const booking = await Booking.findOrFail(params.id)

        let events = await Event.all()
        if (events !== null) {
          for (let event of events) {
            if (event.bookings !== null && event.bookings.length > 0) {
              const existingBookingIndex = event.bookings.findIndex(b => b['id'] === booking.id)
              if (existingBookingIndex > -1) {
                event.bookings.splice(existingBookingIndex, 1)
                event.participant_count = event.bookings.reduce((pVal, cVal) => pVal + cVal['count'], 0)
                await event.save()
              }
            }
          }
        }

        await booking.delete()
        return response.ok(booking.id)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Booking ID required')
    }
  }
}
