import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Event from 'App/Models/Event'
import {DateTime} from 'luxon'
import Booking from 'App/Models/Booking'
import ical, {ICalCalendar, ICalCalendarMethod} from 'ical-generator'


export default class EventsController {

  private static calendar : ICalCalendar

  public async store ({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      name: schema.string(),
      abbreviation: schema.string(),
      start_date: schema.date(),
      end_date: schema.date(),
      contact_email: schema.string.optional(),
      announcement_link: schema.string.optional(),
      max_participants: schema.number.optional(),
      info: schema.string.optional(),
      event_price_day: schema.number.optional(),
      meal_price_day: schema.number.optional()
    })

    try {
      const validateEvent = await request.validate({
        schema: validationSchema,
      })
      const event = new Event()
      event.name = validateEvent.name
      event.abbreviation = validateEvent.abbreviation
      event.start_date = DateTime.fromISO(<string>validateEvent.start_date.toISODate())
      event.end_date = DateTime.fromISO(<string>validateEvent.end_date.toISODate())
      if (validateEvent.contact_email !== undefined)
        event.contact_email = validateEvent.contact_email
      if (validateEvent.announcement_link !== undefined)
        event.announcement_link = validateEvent.announcement_link
      if (validateEvent.max_participants !== undefined)
        event.max_participants = validateEvent.max_participants
      if (validateEvent.info !== undefined)
        event.info = validateEvent.info
      if (validateEvent.event_price_day !== undefined)
        event.event_price_day = validateEvent.event_price_day
      if (validateEvent.meal_price_day !== undefined)
        event.meal_price_day = validateEvent.meal_price_day
      await event.save()
      await this.updateCalendar()
      return response.ok(event.id)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async update ({ params, request, response }: HttpContextContract) {
    if (params.id) {
      const validationSchema = schema.create({
        name: schema.string.optional(),
        abbreviation: schema.string.optional(),
        start_date: schema.date.optional(),
        end_date: schema.date.optional(),
        contact_email: schema.string.optional(),
        announcement_link: schema.string.optional(),
        max_participants: schema.number.nullableAndOptional(),
        bookings: schema.array.nullableAndOptional().members(schema.object().members({
          id: schema.number(),
          count: schema.number(),
          confirmed: schema.boolean()
        })),
        info: schema.string.nullableAndOptional(),
        event_price_day: schema.number.optional(),
        meal_price_day: schema.number.optional()
      })

      try {
        const validateEvent = await request.validate({
          schema: validationSchema,
        })
        const event = await Event.findOrFail(params.id)
        if (validateEvent.name !== undefined)
          event.name = validateEvent.name
        if (validateEvent.abbreviation !== undefined)
          event.abbreviation = validateEvent.abbreviation
        if (validateEvent.start_date !== undefined)
          event.start_date = DateTime.fromISO(<string>validateEvent.start_date.toISODate())
        if (validateEvent.end_date !== undefined)
          event.end_date = DateTime.fromISO(<string>validateEvent.end_date.toISODate())
        if (validateEvent.contact_email !== undefined)
          event.contact_email = validateEvent.contact_email
        if (validateEvent.announcement_link !== undefined)
          event.announcement_link = validateEvent.announcement_link
        if (validateEvent.max_participants !== undefined)
          event.max_participants = validateEvent.max_participants
        if (validateEvent.bookings !== undefined)
          event.bookings = validateEvent.bookings
        if (validateEvent.info !== undefined)
          event.info = validateEvent.info
        if (validateEvent.event_price_day !== undefined)
          event.event_price_day = validateEvent.event_price_day
        if (validateEvent.meal_price_day !== undefined)
          event.meal_price_day = validateEvent.meal_price_day

        if (event.bookings !== null) {
          for (const eb of event.bookings) {
            let booking = await Booking.findOrFail(eb['id'])
            if (booking.paf_events !== null && booking.paf_events.length > 0) {
              const existingEventIndex = booking.paf_events.findIndex(b => b['id'] === event.id)
              if (existingEventIndex > -1) {
                booking.paf_events[existingEventIndex] = {
                  id: event.id,
                  name: event.name,
                  abbreviation: event.abbreviation,
                  confirmed: eb['confirmed']
                }
                await booking.save()
              }
            }
          }
        }
        await event.save()
        await this.updateCalendar()
        return response.ok(event.id)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Event ID required')
    }
  }

  public async show ({ params, response }: HttpContextContract) {
    if (params.id) {
      try {
        const event = await Event.findOrFail(params.id)
        return response.json(event)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Event ID required')
    }
  }

  public async list ({ response }: HttpContextContract) {
    try {
      const events = await Event.query().where('id', '>=', 0).orderBy('start_date', 'desc')
      return response.json(events)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async delete ({ params, response }: HttpContextContract) {
    if (params.id) {
      try {
        const event = await Event.findOrFail(params.id)
        if (event.bookings !== null) {
          for (const eb of event.bookings) {
            let booking = await Booking.findOrFail(eb['id'])
            if (booking.paf_events !== null && booking.paf_events.length > 0) {
              const existingEventIndex = booking.paf_events.findIndex(b => b['id'] === event.id)
              if (existingEventIndex > -1) {
                booking.paf_events.splice(existingEventIndex, 1)
                await booking.save()
              }
            }
          }
        }
        await event.delete()
        await this.updateCalendar()
        return response.ok(event.id)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Event ID required')
    }
  }

  public async cal ({ response }: HttpContextContract) {
    if (!EventsController.calendar)
      await this.updateCalendar()

    response.header('Content-Type', 'text/calendar; charset=utf-8')
    response.append('Content-Disposition', 'attachment; filename="calendar.ics"')
    response.send(EventsController.calendar.toString())
    return
  }

  private async updateCalendar() {
    try {
      if (!EventsController.calendar)
        EventsController.calendar = ical({
          description: 'PAF Event Calendar ' + DateTime.now().year.toString(),
          method: ICalCalendarMethod.PUBLISH,
          name: 'PAF Event Calendar ' + DateTime.now().year.toString(),
          prodId: '//pa-f.net//Event Calendar ' + DateTime.now().year.toString() + '//EN',
          source: 'https://api.pa-f.net/event-calendar',
          // source: 'http://localhost:3333/event-calendar',
          timezone: 'Europe/Paris',
          ttl: 86400
        })

      const events = await Event.query().where('start_date', '>=', DateTime.now().startOf('year').toISODate()).andWhere('end_date', '<', DateTime.now().endOf('year').toISODate()).orderBy('start_date', 'desc')
      events.forEach(e => {
        const event = EventsController.calendar.createEvent({
          start: e.start_date,
          end: e.end_date.plus({days: 1}),
          allDay: true,
          description: e.name,
          summary: e.name,
          url: e.announcement_link,
          sequence: Math.round(DateTime.now().toSeconds())
        })
        event.uid('Event:' + e.id + '@pa-f.net')
      })
    } catch (e) {
      console.error(e.message)
    }
  }
}
