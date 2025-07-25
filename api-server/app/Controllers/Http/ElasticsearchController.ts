import {HttpContextContract} from '@ioc:Adonis/Core/HttpContext'
import fs from 'fs'
import {parse} from 'csv-parse'
import {DateTime, Duration, Interval} from 'luxon'
import shortHash from 'shorthash2'
import {Client} from '@elastic/elasticsearch'
import { finished } from 'stream/promises'
import Database from '@ioc:Adonis/Lucid/Database'
import Booking from 'App/Models/Booking'
import * as process from 'node:process'

export default class ElasticsearchController {

  static client = new Client({
    node: process.env.ELASTICSEARCH_NODE!,
    auth: {
      username: process.env.ELASTICSEARCH_USER!,
      password: process.env.ELASTICSEARCH_PASSWORD!
    }, tls: {
      rejectUnauthorized: false
    }
  })

  public async importBookings({request, response}: HttpContextContract) {

    try {

      // const start_date = request.input('2023-01-01T01:00:00.000Z')
      // const end_date = request.input('2024-01-01T01:00:00.000Z')
      const start_date = request.input('start_date')
      const end_date = request.input('end_date')

      let bulk = ''
      const days = Interval.fromDateTimes(DateTime.fromSQL(start_date), DateTime.fromSQL(end_date).plus({days: 1})).splitBy(Duration.fromObject({days: 1}))
      let bookings = await Database.modelQuery(Booking).where('arrival', '<=', end_date).andWhere('departure', '>', start_date).andWhere('cancelled', '=', 0)
      days.forEach(day => {
        let today = bookings.filter(b => Interval.fromDateTimes(DateTime.fromISO(b.arrival), DateTime.fromISO(b.departure)).contains(day.start))
        today.forEach(b => {
          const group_name = b.group_name && b.group_name.length > 0 ? b.group_name : null
          const paf_events =  b.paf_events && b.paf_events.length > 0 ? b.paf_events.filter(e => e.confirmed) : null
          let stayers: string[] = []
          for (let i = 1; i <= b.people_count; i++) {
            stayers.push(b.id + '-' + i)
          }
          bulk = bulk.concat('{"create":{"_index":"paf-bookings","_id":"' + b.id + '-' + day.start.toISO() + '"}}\n{' +
            '"@timestamp":"' + day.start.toISO() + '",' +
            '"booking_id":' + b.id + ',' +
            '"booking_date":"' + b.booking_date.toISO() + '",' +
            '"name":"' + b.name + '",' +
            (b.member_id && b.member_id > 0 ? '"member_id":' + b.member_id + ',' : '') +
            '"sci_member":' + (b.sci_member === 1) + ',' +
            '"arrival":"' + b.arrival.toISO() + '",' +
            '"departure":"' + b.departure.toISO() + '",' +
            '"stay_days":' + b.stay_days + ',' +
            '"people_count":' + b.people_count + ',' +
            '"stayers":' + JSON.stringify(stayers) + ',' +
            '"membership_count":' + b.membership_count + ',' +
            (b.date_paid ? '"date_paid":"' + b.date_paid.toISO() + '",' : '') +
            (b.invoice_nr && b.invoice_nr.length > 0 ? '"invoice_nr":"' + b.invoice_nr + '",' : '') +
            '"no_stay_pay":' + (b.no_stay_pay === 1) + ',' +
            (group_name ? '"group_name":"' + b.group_name + '",' : '') +
            (paf_events ? '"paf_events":' + JSON.stringify(paf_events) + ',' : '') +
            '"stay_amount":' + b.stay_amount + ',' +
            (b.membership_amount && b.membership_amount > 0 ? '"membership_amount":' + b.membership_amount + ',' : '') +
            (b.meals_amount && b.meals_amount > 0 ? '"meals_amount":' + b.meals_amount + ',' : '') +
            (b.custom_amount && b.custom_amount > 0 ? '"custom_amount":' + b.custom_amount + ',' : '') +
            '"total_amount":' + b.total_amount +
            '}\n')
        })
      })

      console.log(bulk)

      const resp = await ElasticsearchController.client.bulk({
        // @ts-ignore
        body: bulk
      })

      console.log(resp + ': ' + JSON.stringify(resp))

      return response.ok('Success')
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }
  public async importEmporia({request, response}: HttpContextContract) {
    try {

      const csv = request.file('emporia-csv')

      if (csv && csv.tmpPath) {
        const bulk = await ElasticsearchController.processCSVFile(csv.tmpPath)
        if (!bulk) {
          await fs.promises.unlink(csv.tmpPath)
          return response.badRequest('Invalid CSV or time interval')
        }

        await ElasticsearchController.client.bulk({
          // @ts-ignore
          body: bulk
        })
        await fs.promises.unlink(csv.tmpPath)
      } else
        return response.badRequest('Upload failed')
    } catch (error) {
      return response.badRequest(error.messages)
    }
    return response.ok('Success')
  }

  private static async processCSVFile(path) {

    const data = []
    let request = ''
    let tsLabel = ''

    try {
      const parser = fs.createReadStream(path)
        .pipe(parse({
            delimiter: ",",
            columns: true,
            ltrim: true,
          })
        )
        .on("data", function (row) {
          // @ts-ignore
          data.push(row)
        })
        .on("error", function (error) {
          console.log(error.message)
        })
        .on("end", async function () {
          let lastTs: null | DateTime = null
          for (const row of data) {
            if (tsLabel.length === 0) {
              const _tsLabel = Object.keys(row).find(s => s.startsWith('Time Bucket'))
              tsLabel = _tsLabel ? _tsLabel : 'Time Bucket (Europe/London)'
            }
            let ts = DateTime.fromFormat(row[tsLabel], 'LL/dd/y TT')
            if (lastTs && Interval.fromDateTimes(lastTs, ts).length('minutes') !== 1) {
              // @ts-ignore
              request = null
              return
            }
            for (const col of Object.entries(row)) {
              if (col[0] !== tsLabel && col[1] !== 'No CT')
                request = request.concat('{"create":{"_index":"paf-emporia","_id":"' + ts.toISO() + '-' + shortHash(col[0]) + '"}}\n{"@timestamp":"' + ts.toISO() + '","label":"' + col[0] + '","data":' + parseFloat(<string>col[1]) + '}\n')
            }
            lastTs = ts
          }
        })
      await finished(parser)
      return request
    } catch (error) {
      console.log(error)
      return null
    }
  }

}
