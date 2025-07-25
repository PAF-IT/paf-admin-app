import {api} from './api'

export async function getAccounting(year) {
    try {
        const result = await api.get('/accounting/'+year)
        return result.data
    } catch (error) {}
}

export async function bookingsCSV(start, end) {
    try {
        return await api.post('/data/bookings/', {start_date: start, end_date: end}, {responseType: 'blob'})
            .then(response => {
                let url = window.URL.createObjectURL(response.data)
                let a = document.createElement('a')
                a.href = url
                a.download = 'PAF bookings ' + start + ' - ' + end
                a.click()
                a.remove()
                setTimeout(() => window.URL.revokeObjectURL(url), 100)
            })
    } catch (error) {}
}

export async function invoicesCSV(start, end) {
    try {
        return await api.post('/data/invoices/', {start_date: start, end_date: end}, {responseType: 'blob'})
            .then(response => {
                let url = window.URL.createObjectURL(response.data)
                let a = document.createElement('a')
                a.href = url
                a.download = 'PAF invoices ' + start + ' - ' + end
                a.click()
                a.remove()
                setTimeout(() => window.URL.revokeObjectURL(url), 100)
            })
    } catch (error) {}
}

export async function getStats(start, end) {
    try {
        const result = await api.post('/bookings/stats', {start_date: start, end_date: end})
        return result.data
    } catch (error) {}
}

export async function getDayStats(date) {
    try {
        const result = await api.post('/bookings/stats', {date: date})
        return result.data
    } catch (error) {}
}