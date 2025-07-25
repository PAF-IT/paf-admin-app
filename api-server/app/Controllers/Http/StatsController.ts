import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import {DateTime, Duration, Interval} from 'luxon'
import Setting from 'App/Models/Setting'
import Booking from 'App/Models/Booking'
import Event from 'App/Models/Event'
import {Readable} from 'stream'

export default class StatsController {

  public async stats({request, response}: HttpContextContract) {

    try {

      const start_date = request.input('start_date')
      const end_date = request.input('end_date')
      const date = request.input('date')

      const compare = function (a, b) {
        let nameA = a.name.toUpperCase();
        let nameB = b.name.toUpperCase();
        if (nameA < nameB)
          return -1;
        if (nameA > nameB)
          return 1;
        return 0;
      }

      const compareCancelled = function (a, b) {
        if (a.cancelled < b.cancelled)
          return -1;
        if (a.cancelled > b.cancelled)
          return 1;
        return 0;
      }

      // single day stats

      if (date !== undefined) {
        let bookings = await Booking.query().where('arrival', '<=', date).andWhere('departure', '>=', date)
        let events = await Event.query().where('start_date', '<=', date).andWhere('end_date', '>=', date)
        let result: any[] = []
        let waitingCount = 0
        let waitingDetails: any[] = []
        if (bookings.find(b => b.paf_events !== null && b.paf_events.length > 0)) {
          bookings = bookings.filter(b => b.paf_events === null || !b.paf_events.find(eb => {
            if (!eb.confirmed && events.find(e => e.id === eb.id)) {
              if (b.departure.toISODate() !== date) {
                waitingCount += b.people_count !== null ? b.people_count : 0
                waitingDetails.push({
                  name: b.name,
                  people_count: b.people_count,
                  arrival: b.arrival,
                  departure: b.departure,
                  info: b.info,
                  cancelled: b.cancelled !== null && b.cancelled,
                  events: b.paf_events !== null ? b.paf_events.map(e => {
                    return {
                      abbreviation: e.abbreviation,
                      confirmed: e.confirmed
                    }
                  }) : [],
                  group_name: b.group_name
                })
              }
              return true
            }
            return false
          }))
        }
        result.push({
          label: 'Arrivals',
          count: bookings.filter(b => b.arrival.toISODate() === date && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0),
          details: bookings.filter(b => b.arrival.toISODate() === date).sort(compare).sort(compareCancelled).map(b => {
            return {
              name: b.name,
              people_count: b.people_count,
              arrival: b.arrival,
              departure: b.departure,
              info: b.info,
              cancelled: b.cancelled !== null && b.cancelled,
              events: b.paf_events !== null ? b.paf_events.map(e => {
                return {
                  abbreviation: e.abbreviation,
                  confirmed: e.confirmed
                }
              }) : [],
              group_name: b.group_name
            }
          })
        })
        // result.push({
        //   label: 'Cancelled arrivals',
        //   count: bookings.filter(b => b.arrival === date && b.cancelled === 1).reduce((prev, b) => prev + b.people_count, 0),
        //   details: bookings.filter(b => b.arrival === date && b.cancelled === 1).sort(compare).map(b => {
        //     return {
        //       name: b.name,
        //       people_count: b.people_count,
        //       arrival: b.arrival,
        //       departure: b.departure,
        //       info: b.info,
        //       events: b.paf_events
        //     }
        //   })
        // })
        result.push({
          label: 'Departure',
          count: bookings.filter(b => b.departure.toISODate() === date && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0),
          details: bookings.filter(b => b.departure.toISODate() === date && !b.cancelled).sort(compare).map(b => {
            return {
              name: b.name,
              people_count: b.people_count,
              arrival: b.arrival,
              departure: b.departure,
              info: b.info,
              events: b.paf_events !== null ? b.paf_events.map(e => {
                return {
                  abbreviation: e.abbreviation,
                  confirmed: e.confirmed
                }
              }) : [],
              group_name: b.group_name
            }
          })
        })
        result.push({
          label: 'Longstayers',
          count: bookings.filter(b => b.longstayer && !b.cancelled && b.departure.toISODate() !== date).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0),
          details: bookings.filter(b => b.longstayer && !b.cancelled && b.departure.toISODate() !== date).sort(compare).map(b => {
            return {
              name: b.name,
              people_count: b.people_count,
              arrival: b.arrival,
              departure: b.departure,
              info: b.info,
              events: b.paf_events !== null ? b.paf_events.map(e => {
                return {
                  abbreviation: e.abbreviation,
                  confirmed: e.confirmed
                }
              }) : [],
              group_name: b.group_name
            }
          })
        })
        result.push({
          label: 'Total',
          count: bookings.filter(b => !b.cancelled && b.departure.toISODate() !== date).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0),
          details: bookings.filter(b => !b.cancelled && b.departure.toISODate() !== date).sort(compare).map(b => {
            return {
              name: b.name,
              people_count: b.people_count,
              arrival: b.arrival,
              departure: b.departure,
              info: b.info,
              events: b.paf_events !== null ? b.paf_events.map(e => {
                return {
                  abbreviation: e.abbreviation,
                  confirmed: e.confirmed
                }
              }) : [],
              group_name: b.group_name
            }
          })
        })
        result.push({
          label: 'Waiting list',
          count: waitingCount,
          details: waitingDetails
        })
        return response.ok(result)
      }

      // date range stats

      if (start_date !== undefined && end_date !== undefined) {
        const days = Interval.fromDateTimes(DateTime.fromISO(start_date), DateTime.fromISO(end_date).plus({days: 1})).splitBy(Duration.fromObject({days: 1}))
        const bookings = await Booking.query().where('arrival', '<=', end_date).andWhere('departure', '>=', start_date)
        const events = await Event.query().where('start_date', '<=', end_date).andWhere('end_date', '>=', start_date)
        const settings = await Setting.findOrFail(1)
        const stats = new Array<Object>()
        days.forEach(day => {
          let today = bookings.filter(b => day.start && Interval.fromDateTimes(b.arrival, b.departure.plus({days: 1})).contains(day.start))
          let todayEvents = events.filter(e => day.start && Interval.fromDateTimes(e.start_date, e.end_date.plus({days: 1})).contains(day.start))

          // count and remove unconfirmed stays (event waiting list) for today
          let waitingCount = 0
          if (today.find(b => b.paf_events !== null && b.paf_events.length > 0)) {
            today = today.filter(b => b.paf_events === null || !b.paf_events.find(eb => {
              if (!eb.confirmed && todayEvents.find(e => e.id === eb.id)) {
                if (day.start && Interval.fromDateTimes(b.arrival, b.departure).contains(day.start))
                  waitingCount += b.people_count !== null ? b.people_count : 0
                return true
              }
              return false
            }))
          }
          let arrivals = today.filter(b => day.start && b.arrival.toISODate() === day.start.toISODate() && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0)
          let cancelled = today.filter(b => day.start && b.arrival.toISODate() === day.start.toISODate() && b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0)
          let departures = today.filter(b => day.start && b.departure.toISODate() === day.start.toISODate() && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0)
          let stayers = today.filter(b => (b.paf_events === null || !b.paf_events.find(eb => {
            let event = events.find(e => e.id === eb.id)
            return eb.confirmed && event && day.start && Interval.fromDateTimes(event.start_date, event.end_date.plus({day: 1})).contains(day.start)
          })) && day.start && b.departure.toISODate() !== day.start.toISODate() && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0)
          let eventstayers = today.filter(b => day.start && b.paf_events !== null && b.paf_events.find(eb => {
            let event = events.find(e => e.id === eb.id)
            return eb.confirmed && event && day.start && Interval.fromDateTimes(event.start_date, event.end_date.plus({day: 1})).contains(day.start)
          }) && b.departure.toISODate() !== day.start.toISODate() && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0)
          let total = today.filter(b => day.start && b.departure.toISODate() !== day.start.toISODate() && !b.cancelled).reduce((prev, b) => prev + (b.people_count !== null ? b.people_count : 0), 0)
          const groups = new Set()
          today.forEach(b => {
            if (!b.cancelled && b.group_name !== null && b.group_name !== "")
              groups.add(b.group_name)
          })
          const eventSet = new Set()
          todayEvents.forEach(e => {
            eventSet.add({
              abbreviation: e.abbreviation,
              start_date: e.start_date.toISODate(),
              end_date: e.end_date.toISODate()
            })
          })
          let maxCapacity = todayEvents.reduce((prev, e) => prev + (e.max_participants !== null ? e.max_participants : 0), 0)
          maxCapacity = maxCapacity > settings.house_capacity ? maxCapacity : settings.house_capacity
          if (day.start)
            stats.push({
              date: day.start.toISODate(),
              arrivals: arrivals,
              cancelled: cancelled,
              departures: departures,
              stayers: stayers,
              eventstayers: eventstayers,
              waitinglist: waitingCount,
              total: total,
              groups: [...groups],
              events: [...eventSet],
              max_capacity: maxCapacity
            })
        })
        return response.ok(stats)
      }
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async accounting({params, response}: HttpContextContract) {

    if (params.year) {

      const start_date = DateTime.fromISO(params.year+'-01-01')
      const end_date = DateTime.now().year === Number(params.year) ? DateTime.now().endOf('month') : DateTime.fromISO(params.year+'-12-31')
      const months = Interval.fromDateTimes(start_date, end_date).splitBy(Duration.fromObject({months: 1}))

      try {
        if (end_date.isValid && start_date.isValid) {
          const bookings = await Database.from('bookings').whereNotNull('date_paid').andWhere('date_paid', '<=', end_date.toISODate()).andWhere('date_paid', '>=', start_date.toISODate()).orderBy('date_paid', 'asc')
          const invoices = await Database.from('invoices').whereNotNull('date_paid').andWhere('date_paid', '<=', end_date.toISODate()).andWhere('date_paid', '>=', start_date.toISODate()).orderBy('date_paid', 'asc')
          // const bookings = await Database.rawQuery('SELECT * FROM bookings WHERE date_paid >= \'' + start_date.toSQLDate() + '\' AND date_paid <= \'' + end_date.toSQLDate() + '\' AND paid > 0')
          const stats = new Array<Object>()
          if (bookings !== null) {
            months.forEach(month => {
              let payments = new Array<Object>()
              const currentBookings = bookings.filter(b => month.start && Interval.fromDateTimes(month.start, month.start.plus({days: month.start.daysInMonth})).contains(DateTime.fromISO(b.date_paid)))
              currentBookings.forEach(b => payments.push({
                arrival: b.arrival,
                departure: b.departure,
                date_paid: b.date_paid,
                name: b.name,
                invoice: b.invoice_nr === undefined || b.invoice_nr === null || b.invoice_nr === '' ? null : b.invoice_nr,
                baguette: b.invoice_nr !== undefined && b.invoice_nr !== null && b.invoice_nr !== '' ? b.total_amount : 0,
                squid: b.invoice_nr === undefined || b.invoice_nr === null || b.invoice_nr === '' ? b.total_amount : 0
              }))
              const currentInvoices = invoices.filter(i => month.start && Interval.fromDateTimes(month.start, month.start.plus({days: month.start.daysInMonth})).contains(DateTime.fromISO(i.date_paid)))
              currentInvoices.forEach(i => {
                if (!payments.find((p: any) => p.invoice === i.invoice_nr))
                  payments.push({
                    arrival: i.stay_start,
                    departure: i.stay_end,
                    date_paid: i.date_paid,
                    name: i.name,
                    invoice: i.invoice_nr,
                    baguette: i.total_amount,
                    squid: 0
                  })
              })
              payments = payments.sort((a: any, b: any) => DateTime.fromSQL(a.date_paid) < DateTime.fromSQL(b.date_paid) ? -1 : 1)
              // let baguette = currentBookings.filter(b => b.invoice_nr !== undefined && b.invoice_nr !== null && b.invoice_nr !== '').reduce((prev, b) => prev + b.total_amount, 0)
              // baguette += currentInvoices.reduce((prev, i) => prev + i.total_amount, 0)
              // const squid = currentBookings.filter(b => b.invoice_nr === undefined || b.invoice_nr === null || b.invoice_nr === '').reduce((prev, b) => prev + b.total_amount, 0)
              const baguette = payments.reduce((prev: number, p: any) => prev + p.baguette, 0)
              const squid = payments.reduce((prev: number, p: any) => prev + p.squid, 0)
              if (month.start)
                stats.push({
                  month: month.start.monthLong + ' ' + params.year,
                  year_month: params.year + '-' + month.start.toFormat('MM'),
                  payments: payments,
                  total_baguette: baguette,
                  total_squid: squid
                })
            })
            return response.ok(stats)
          }
          return response.ok({})
        }
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest()
    }
  }

  public async bookinsgCsv ({ request, response }: HttpContextContract) {
    try {
      const start_date = request.input('start_date')
      const end_date = request.input('end_date')

      let bookings: any[] = []
      let result = 'name,member_id,sci_member,booking_date,arrival,departure,date_paid,people_count,membership_count,invoice_nr,no_stay_pay,no_meal_pay,longstayer,group_name,stay_days,stay_amount,membership_amount,meals_amount, custom_amount, total_amount,paf_events\n'
      bookings = await Database.rawQuery('SELECT * FROM bookings WHERE arrival >= \'' + start_date + '\' AND arrival <= \'' + end_date + '\' AND paid > 0 ORDER BY date_paid ASC')
      bookings = bookings[0].map(b => b.name + ',' + b.member_id + ',' + b.sci_member + ',' + b.booking_date + ',' + b.arrival + ',' + b.departure + ',' + b.date_paid
        + ',' + b.people_count + ',' + b.membership_count + ',' + b.invoice_nr + ',' + b.no_stay_pay + ',' + b.no_meal_pay + ',' + b.longstayer
        + ',' + b.group_name + ',' + b.stay_days + ',' + b.stay_amount + ',' + b.membership_amount + ',' + b.meals_amount + ',' + b.custom_amount + ',' + b.total_amount
        + ',' + (b.paf_events && b.paf_events.length > 0 ? JSON.parse(b.paf_events).map(e => e.name).join('; ') : ''))
      bookings.forEach(b => result += b.toString() + '\n')
      response.header('Content-type', 'text/csv')
      return response.stream(Readable.from(result))
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async invoicesCsv ({ request, response }: HttpContextContract) {
    try {
      const start_date = request.input('start_date')
      const end_date = request.input('end_date')

      let invoices: any[] = []
      let result = 'invoice_nr,name,date,custom_amount,total_amount,payment_type,date_paid\n'
      invoices = await Database.rawQuery('SELECT * FROM invoices WHERE date_paid >= \'' + start_date + '\' AND date_paid <= \'' + end_date + '\' AND stay_start IS NULL ORDER BY invoice_nr ASC')
      invoices = invoices[0].map(b => b.invoice_nr + ',' + b.name + ',' + b.date + ',' + b.custom_amount + ',' + b.total_amount + ',' + b.payment_type + ',' + b.date_paid)
      invoices.forEach(b => result += b.toString() + '\n')
      response.header('Content-type', 'text/csv')
      return response.stream(Readable.from(result))
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

}
