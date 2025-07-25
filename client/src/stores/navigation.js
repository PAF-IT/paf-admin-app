import {writable} from 'svelte/store'
import {fetchSettings} from './api'

let navData = {
    dashboard: true,
    booking: false,
    data: false,
    datain: false,
    member: false,
    payment: false,
    invoice: false,
    mattress: false,
    event: false,
    accounting: false,
    reconciliation: false,
    bankrun: false,
    sci: false,
    reservations: false,
    newsletter: false,
    settings: false,
    users: false
}

export const navigation = writable(navData)
export const screenWidthS = writable(false)
export const screenWidthM = writable(false)
export const screenWidthL = writable(false)
export const screenWidthXL = writable(false)

export async function navigateTo(target) {
    Object.keys(navData).forEach(k => navData[k] = (k === target))
    navigation.set(navData)
    await fetchSettings()
}