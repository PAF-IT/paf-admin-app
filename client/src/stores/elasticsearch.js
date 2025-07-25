import {api} from './api'

export async function importEmporiaCSV(data) {
    try {
        return await api.post('/data/emporia-import/', data, {headers: {"Content-Type": "multipart/form-data"}})
    } catch (error) {
        console.error(error)
    }
}

export async function importBookings(start, end) {
    try {
        return await api.post('/data/bookings-import/', {"start_date": start, "end_date": end})
    } catch (error) {
        console.error(error)
    }
}
