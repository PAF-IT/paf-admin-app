import {writable} from 'svelte/store'
import {api, getSettings, settings} from './api'
import {getSciMember, sciMembers} from './member'
import {DateTime, Interval} from 'luxon'
import {events, getEvents} from './event'


export const bookingNames = writable([])

export async function getBookings(query) {
    try {
        const result = await api.post('/bookings/', query)
        return result.data
    } catch (error) {}
}

export async function getPaymentBookings(query) {
    try {
        const result = await api.post('/payments/', query)
        return result.data
    } catch (error) {}
}

export async function getBookingNames() {
    try {
        const result = await api.get('/bookings/')
        bookingNames.set(result.data)
    } catch (error) {}
}

export async function getGroupNames() {
    try {
        const result = await api.get('/bookings/groups')
        return(result.data.filter(g => g.length > 0))
    } catch (error) {}
}

export async function getBookingsByIds(ids) {
    try {
        ids = {ids: ids}
        const result = await api.post('/bookings/byIds', ids)
        return result.data
    } catch (error) {}
}

export async function getReservationList(year) {
    try {
        const result = await api.get('/bookings/reservations/' + year)
        return result.data
    } catch (error) {}
}

export async function updateBookingPaid(invoiceId, date) {
    try {
        const result = await api.post('/bookingPaid/', {invoice_id: invoiceId, date_paid: date})
        return result.status === 200
    } catch (error) {}
}

export async function createBooking(booking) {
    try {
        const result = await api.post('/booking/', booking)
        return result.data
    } catch (error) {}
}

export async function updateBooking(booking) {
    try {
        const result = await api.put('/booking/'+booking.id, booking)
        return result.status === 200
    } catch (error) {}
}

export async function deleteBooking(id) {
    try {
        const result = await api.delete('/booking/'+id)
        return result.status === 200
    } catch (error) {}
}

export function calculateBookingAmounts(booking) {
    if (!booking.paid || booking.mattress_booking) {
        
        let settings = getSettings()

        if (booking.stay_rate === null || booking.stay_rate === 0)
            booking.stay_rate = booking.stay_days <= settings.short_stay_duration ? settings.price_stay_short : booking.stay_days < 30 ? settings.price_stay : settings.price_stay_month

        if (booking.sci_member && booking.member_id !== null) {
            // let sciMember = $sciMembers.find(m => m.id === booking.member_id)
            let sciMember = getSciMember(booking.member_id)
            if (DateTime.fromSQL(booking.arrival).year < DateTime.now().year) {
                if (booking.no_stay_pay)
                    booking.sci_days_used = 0
                else {
                    let prevYearDays = Math.round(DateTime.fromSQL(booking.arrival).until(DateTime.fromSQL(booking.departure).year < DateTime.now().year ? DateTime.fromSQL(booking.departure) : DateTime.fromSQL(booking.arrival).endOf('year')).length('days'))
                    let currYearDays = Math.round(DateTime.fromSQL(booking.departure).year < DateTime.now().year ? 0 : DateTime.now().startOf('year').until(DateTime.fromSQL(booking.departure)).length('days'))
                    let prevYearSciDaysLeft = settings.sci_days - sciMember.sci_days_used_prev_year
                    let currYearSciDaysLeft = settings.sci_days - sciMember.sci_days_used
                    let prevYearSciDaysUsed = prevYearDays > prevYearSciDaysLeft ? prevYearSciDaysLeft : prevYearDays
                    let currYearSciDaysUsed = currYearDays > currYearSciDaysLeft ? currYearSciDaysLeft : currYearDays
                    booking.sci_days_used = prevYearSciDaysUsed + currYearSciDaysUsed
                }
            } else
                booking.sci_days_used = !booking.no_stay_pay ? booking.stay_days <= settings.sci_days - sciMember?.sci_days_used ? booking.stay_days : settings.sci_days - sciMember?.sci_days_used : 0
        }

        booking.stay_amount = booking.no_stay_pay ? 0 : (booking.stay_days - booking.sci_days_used) * booking.stay_rate

        // if booking is for more than one person, add amount for full period for the rest of
        booking.stay_amount += booking.people_count === 1 ? 0 : (booking.people_count - 1) * booking.stay_days * booking.stay_rate

        let mealsDays = 0
        let mealsAmount = 0
        let stayInterval = Interval.fromDateTimes(DateTime.fromSQL(booking.arrival), DateTime.fromSQL(booking.departure))
        booking.paf_events.forEach(pafEvent => {
            let event = getEvents().find(e => e.id === pafEvent.id)
            let intersection = stayInterval.intersection(Interval.fromDateTimes(DateTime.fromSQL(event.start_date), DateTime.fromSQL(event.end_date)))
            if (intersection !== null && event.meal_price_day > 0) {
                mealsDays += intersection.length('days')
                mealsAmount += intersection.length('days') * event.meal_price_day
            }
        })
        booking.meals_days = mealsDays
        booking.meals_amount = booking.no_meal_pay ? 0 : mealsAmount * booking.people_count
        booking.membership_amount = booking.membership_count * settings.price_membership
        booking.total_amount = booking.stay_amount + booking.membership_amount + booking.meals_amount
        booking.meals_amount_orig = booking.meals_amount
        booking.membership_amount_orig = booking.membership_amount
        booking.stay_amount_orig = booking.stay_amount
    }

    return booking
}