import axios from 'axios'
import {get, writable} from 'svelte/store'


export const api = axios.create({
    baseURL: 'http://localhost:3333'
    // baseURL: 'https://api.pa-f.net'
})

export const loggedIn = writable({authenticating: true, loggedIn: false})
export const role = writable('')
export const settings = writable({})
export const version = '1.2.4'


export async function validateAuth() {
    if (sessionStorage.token !== undefined && sessionStorage.token !== null  && sessionStorage.token !== 'null') {
        api.defaults.headers.common['Authorization'] = `Bearer ${sessionStorage.token}`
        try {
            const result = await api.head('/')
            loggedIn.set({authenticating: false, loggedIn: result.status === 200})
            role.set(sessionStorage.role)
        } catch (error) {
            loggedIn.set({authenticating: false, loggedIn: false})
        }
    } else
        loggedIn.set({authenticating: false, loggedIn: false})
}

export async function login(credentials) {
    try {
        const result = await api.post('/login/', credentials)
        if (result.data.token !== undefined && result.data.token !== null) {
            api.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`
            sessionStorage.token = result.data.token
            sessionStorage.role = result.data.role
            role.set(result.data.role)
            await validateAuth()
        }
    } catch (error) {}
}

export async function logout() {
    try {
        const result = await api.post('/logout/')
        sessionStorage.token = null
        loggedIn.set(result.status !== 200)
    } catch (error) {}
}

export async function fetchSettings() {
    try {
        const result = await api.get('/settings/')
        settings.set(result.data)
    } catch (error) {}
}

export async function updateSettings(settings) {
    try {
        const result = await api.put('/settings/', settings)
        return result.status === 200
    } catch (error) {}
}

export function getSettings() {
    return get(settings)
}