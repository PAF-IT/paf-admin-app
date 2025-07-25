import {api} from './api'

export async function getUsers() {
    try {
        const result = await api.get('/users/')
        return result.data
    } catch (error) {}
}

export async function registerUser(user) {
    try {
        user.password_confirmation = user.password
        const result = await api.post('/user/', user)
        return result.status === 200
    } catch (error) {}
}

export async function deleteUser(id) {
    try {
        const result = await api.delete('/user/'+id)
        return result.status === 200
    } catch (error) {}
}