import {get, writable} from 'svelte/store'
import {api} from './api'


export const events = writable([])


export async function fetchEvents() {
    try {
        const result = await api.get('/events/')
        result.data.forEach(e => {
            e.selected = false
            e.show = true
        })
        events.set(result.data)
    } catch (error) {}
}

export async function getEvent(id) {
    try {
        const result = await api.get('/event/'+id)
        return result.data
    } catch (error) {}
}

export async function createEvent(event) {
    try {
        const result = await api.post('/event/', event)
        return result.data
    } catch (error) {}
}

export async function updateEvent(event) {
    try {
        const result = await api.put('/event/'+event.id, event)
        return result.data
    } catch (error) {}
}

export async function deleteEvent(id) {
    try {
        const result = await api.delete('/event/'+id)
        return result.status === 200
    } catch (error) {}
}

export function getEvents() {
    return get(events)
}