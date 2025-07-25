import {writable} from 'svelte/store'
import {api} from './api'


export const accounts = writable([])
export const allocatedNights = writable([])
export const income = writable([])
export const mattressNames = writable([])

export async function getAccounts() {
    try {
        const result = await api.get('/mattress/account/')
        accounts.set(result.data)
    } catch (error) {}
}

export async function getAllocatedNights() {
    try {
        const result = await api.get('/mattress/allocated/')
        allocatedNights.set(result.data)
    } catch (error) {}
}

export async function getIncome() {
    try {
        const result = await api.get('/mattress/income/')
        income.set(result.data)
    } catch (error) {}
}

export async function getTransactions(query) {
    try {
        const result = await api.post('/mattress/list/', query)
        return result.data
    } catch (error) {}
}

export async function getTransactionsByBookingId(id) {
    try {
        const result = await api.get('/mattress/booking/'+id)
        return result.data[0]
    } catch (error) {}
}

export async function getMattressNames() {
    try {
        const result = await api.get('/mattress/names/')
        mattressNames.set(result.data)
    } catch (error) {}
}

export async function createTransaction(transaction) {
    try {
        const result = await api.post('/mattress/', transaction)
        return result.status === 200
    } catch (error) {}
}

export async function updateTransaction(transaction) {
    try {
        const result = await api.put('/mattress/'+transaction.id, transaction)
        return result.status === 200
    } catch (error) {}
}

export async function deleteTransaction(id) {
    try {
        const result = await api.delete('/mattress/'+id)
        return result.status === 200
    } catch (error) {}
}