import axios from 'axios'
import fs from 'fs'
import * as url from 'url'
import * as process from 'node:process'


export default class Dropbox {

  static accessToken: string | null = null


  static async upload(folder, filePath, fileName, year) {

    if (Dropbox.accessToken === null)
      await this.getAccessToken()

    axios({
      method: 'POST',
      url: 'https://content.dropboxapi.com/2/files/upload',
      headers: {
        'Authorization': 'Bearer ' + Dropbox.accessToken,
        'Dropbox-API-Arg': JSON.stringify({
          'path': '/PAF Admin/' + folder + '/' + year + '/' + fileName,
          'mode': 'overwrite',
          'autorename': true,
          'mute': false,
          'strict_conflict': false
        }),
        'Content-Type': 'application/octet-stream'
      },
      data: fs.createReadStream(filePath)
    }).catch(err => {
      console.error(err)
      if (err.response && err.response.status === 401)
          this.refreshAccessToken('upload', folder, filePath, fileName, year)
    })
  }

  static async deleteInvoice(fileName, year) {

    if (Dropbox.accessToken === null)
      await this.getAccessToken()

    await axios({
      method: 'POST',
      url: 'https://api.dropboxapi.com/2/files/delete_v2',
      headers: {
        'Authorization': 'Bearer ' + Dropbox.accessToken,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        path: '/PAF Admin/invoices/' + year + '/' + fileName
      })
    }).catch(err => {
      console.error(err)
      if (err.response && err.response.status === 401)
        this.refreshAccessToken('delete', null, null, fileName, year)
    })
  }

  private static async getAccessToken() {
    await Dropbox.refreshAccessToken(null, null, null, null, null)
  }

  private static async refreshAccessToken(action, type, filePath, fileName, year) {

    const params = new url.URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN!
    })

    await axios({
      method: 'POST',
      url: 'https://api.dropboxapi.com/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: process.env.DROPBOX_USER!,
        password: process.env.DROPBOX_PASSWORD!
      },
      data: params.toString()
    }).then(response => {
      if (response?.data?.access_token)
        Dropbox.accessToken = response.data.access_token
    }).catch(err => {
      console.error(err)
    })

    if (action) {
      switch (action) {
        case 'upload':
          Dropbox.upload(type, filePath, fileName, year)
          break
        case 'delete':
          Dropbox.deleteInvoice(fileName, year)
      }
    }
  }
}
