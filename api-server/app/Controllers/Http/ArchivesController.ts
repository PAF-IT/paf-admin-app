import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import _ from 'lodash'
import Invoice from 'App/Models/Invoice'
import Member from 'App/Models/Member'
import Application from '@ioc:Adonis/Core/Application'
import assert from "assert";


export default class ArchivesController {

  public async downloadInvoice({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        const invoice = await Invoice.findByOrFail('id', params.id)
        assert(invoice.pdf_path)
        response.header('Content-type', 'application/pdf')
        return response.download(Application.publicPath(invoice.pdf_path))
      } catch (error) {
        return response.notFound(error.messages)
      }
    } else {
      return response.badRequest('Invoice ID required')
    }
  }

  public async invoice({ request, response }: HttpContextContract) {

    try {
      const match = request.input('match')
      const dateRange = request.input('date_range')
      const sort = request.input('sort')
      const paginate = request.input('paginate', { page: 1, per_page: 50 })
      const per_page = _.get(paginate, 'per_page')
      const page = _.get(paginate, 'page')
      const offset = (page - 1) * per_page

      const query = 'SELECT * FROM invoice'
        + (match !== undefined || dateRange !== undefined ? ' WHERE ' : '')
        + (match !== undefined ? _.get(match, 'field') + ' = \"' + _.get(match, 'value') + '\"' : '')
        + (match !== undefined && dateRange !== undefined ? ' AND ' : '')
        + (dateRange !== undefined ? 'date >= \"' + _.get(dateRange, 'start') + '\"' + ' AND date <= \"' + _.get(dateRange, 'end') + '\"' : '')
        + (sort !== undefined ? ' ORDER BY ' + _.get(sort, 'field') + ' ' + _.get(sort, 'order') : '')
        + ' LIMIT ' + offset + ',' + per_page

      const meta_query = 'SELECT COUNT(*) as count FROM invoice'
        + (match !== undefined || dateRange !== undefined ? ' WHERE ' : '')
        + (match !== undefined ? _.get(match, 'field') + ' = \"' + _.get(match, 'value') + '\"' : '')
        + (match !== undefined && dateRange !== undefined ? ' AND ' : '')
        + (dateRange !== undefined ? 'date >= \"' + _.get(dateRange, 'start') + '\"' + ' AND date <= \"' + _.get(dateRange, 'end') + '\"' : '')

      const result = await Database.rawQuery(query)
      const meta = await Database.rawQuery(meta_query)

      return response.ok({
        rows: result[0],
        meta: {
          total: meta[0][0].count,
          per_page: per_page,
          current_page: page,
          last_page: Math.ceil(meta[0][0].count / per_page)
        }
      })
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async downloadMembership({ params, response }: HttpContextContract) {

    if (params.id) {
      try {
        const member = await Member.findByOrFail('id', params.id)
        response.header('Content-type', 'application/pdf')
        return response.download('data/' + member.pdf_path)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('Member ID required')
    }
  }

  public async member({ request, response }: HttpContextContract) {

    try {
      const match = request.input('match')
      const dateRange = request.input('date_range')
      const sort = request.input('sort')
      const paginate = request.input('paginate', { page: 1, per_page: 50 })
      const per_page = _.get(paginate, 'per_page')
      const page = _.get(paginate, 'page')
      const offset = (page - 1) * per_page

      const query = 'SELECT * FROM member'
        + (match !== undefined || dateRange !== undefined ? ' WHERE ' : '')
        + (match !== undefined ? _.get(match, 'field') + ' = \"' + _.get(match, 'value') + '\"' : '')
        + (match !== undefined && dateRange !== undefined ? ' AND ' : '')
        + (dateRange !== undefined ? 'renew_date >= \"' + _.get(dateRange, 'start') + '\"' + ' AND start_date <= \"' + _.get(dateRange, 'end') + '\"' : '')
        + (sort !== undefined ? ' ORDER BY ' + _.get(sort, 'field') + ' ' + _.get(sort, 'order') : '')
        + ' LIMIT ' + offset + ',' + per_page

      const meta_query = 'SELECT COUNT(*) AS count FROM member'
        + (match !== undefined || dateRange !== undefined ? ' WHERE ' : '')
        + (match !== undefined ? _.get(match, 'field') + ' = \"' + _.get(match, 'value') + '\"' : '')
        + (match !== undefined && dateRange !== undefined ? ' AND ' : '')
        + (dateRange !== undefined ? 'renew_date >= \"' + _.get(dateRange, 'start') + '\"' + ' AND start_date <= \"' + _.get(dateRange, 'end') + '\"' : '')

      // console.log(query)
      // console.log(meta_query)

      const result = await Database.rawQuery(query)
      const meta = await Database.rawQuery(meta_query)

      return response.ok({
        rows: result[0],
        meta: {
          total: meta[0][0].count,
          per_page: per_page,
          current_page: page,
          last_page: Math.ceil(meta[0][0].count / per_page)
        }
      })

    } catch (error) {
      return response.badRequest(error.messages)
    }
  }
}
