// import Application from '@ioc:Adonis/Core/Application'
import {HttpContextContract} from "@ioc:Adonis/Core/HttpContext";
import Member from "App/Models/Member";
import * as fs from "fs";

export default class MembershipsController {

  public async pdf({ params, response }: HttpContextContract) {

    if (params.id) {
      try {

        const member = await Member.findOrFail(params.id)

        const PDFDocument = require('pdfkit')
        const doc = new PDFDocument

        const filePath = 'public/' + member.id + '.pdf'
        doc.pipe(fs.createWriteStream(filePath));

        doc.text(member.email, 100, 100)


        doc.end();
        return response.download(filePath);

        // return response.json(filePath);

      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.notFound(params.id)
    }
  }

}
