import User from 'App/Models/User'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'


export default class AuthController {

  public async register ({ request, response }: HttpContextContract) {

    const validationSchema = schema.create({
      user: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'user' }),
      ]),
      password: schema.string({ trim: true }, [
        rules.confirmed(),
      ]),
      role: schema.string(),
    })

    const userDetails = await request.validate({
      schema: validationSchema,
    })

    const user = new User()
    user.user = userDetails.user
    user.password = userDetails.password
    user.role = userDetails.role
    await user.save()
    // await auth.login(user)

    return response.ok('Registered successfully')
  }

  public async login ({ auth, request }: HttpContextContract) {

    try {
      const user = request.input('user')
      const password = request.input('password')
      const token = await auth.use("api").attempt(user, password, {
        expiresIn: "7 days"
      })
      let returnToken = JSON.parse(JSON.stringify(token))
      const userDb = await User.findBy('user', user)
      if (userDb !== null)
        returnToken.role = userDb.role
      return returnToken
    } catch (error) {
      console.log('AuthController.ts:login' + error)
    }
  }

  public async logout ({ auth, response }: HttpContextContract) {
    await auth.use("api").logout()
    return response.ok('Logged out')
  }

  public async head ({ response }: HttpContextContract) {
    return response.ok('')
  }

  public async list ({ response }: HttpContextContract) {
    try {
      const users = await User.query().where('id', '>=', 0).andWhere('user', '!=', 'root').orderBy('user', 'asc')
      return response.json(users)
    } catch (error) {
      return response.badRequest(error.messages)
    }
  }

  public async delete ({ params, response }: HttpContextContract) {
    if (params.id) {
      try {
        const user = await User.findOrFail(params.id)
        await user.delete()
        return response.ok(user.id)
      } catch (error) {
        return response.badRequest(error.messages)
      }
    } else {
      return response.badRequest('User ID required')
    }
  }
}
