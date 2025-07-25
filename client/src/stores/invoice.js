import {writable} from 'svelte/store'
import {api} from './api'


export const invoiceNames = writable([])
export const invoiceNumbers = writable([])
export const invoiceNumberStrings = writable([])
export const invoiceBankRunNumbers = writable([])
export const invoiceReconciliationNumbers = writable([])


export async function getInvoices(page) {
    try {
        const result = await api.post('/invoices/', {page: page, limit: 50})
        return result.data
    } catch (error) {}
}

export async function getBankRunInvoices(array) {
    try {
        const result = await api.post('/invoicesBankRun', {array: array})
        return result.data
    } catch (error) {}
}

export async function getAllBankRunInvoices() {
    try {
        const result = await api.get('/invoicesBankRun')
        return result.data
    } catch (error) {}
}

export async function getReconciliationInvoices(query) {
    try {
        const result = await api.post('/invoices/reconciliation', query)
        return result.data
    } catch (error) {}
}

export async function getInvoiceById(id) {
    try {
        const result = await api.get('/invoice/'+id)
        return result.data
    } catch (error) {}
}

export async function getInvoiceByName(name) {
    try {
        const result = await api.post('/invoices/byName/', {name: name})
        return result.data
    } catch (error) {}
}

export async function getInvoiceByNumber(invoice_nr) {
    try {
        const result = await api.post('/invoices/byNumber/', {invoice_nr: invoice_nr})
        return result.data
    } catch (error) {}
}

export async function getInvoiceNames() {
    try {
        const result = await api.get('/invoices/')
        invoiceNames.set(result.data)
    } catch (error) {}
}

export async function getInvoiceNumbers() {
    try {
        const result = await api.get('/invoiceNumbers/')
        invoiceNumbers.set(result.data.all.map(num => num.substring(0, 6)))
        if (result.data.all)
            invoiceNumberStrings.set(result.data.all)
        if (result.data.bankrun)
            invoiceBankRunNumbers.set(result.data.bankrun)
        if (result.data.reconciliation)
            invoiceReconciliationNumbers.set(result.data.reconciliation)
    } catch (error) {
        console.error(error.message)
    }
}

export async function createInvoice(invoice) {
    try {
        const result = await api.post('/invoice/', invoice)
        return result.data
    } catch (error) {}
}

export async function updateInvoice(invoice, sendMail) {
    try {
        const result = await api.put('/invoice/'+invoice.id+'/'+sendMail, invoice)
        return result.data
    } catch (error) {}
}

export async function deleteInvoice(id) {
    try {
        const result = await api.delete('/invoice/'+id)
        return result.status === 200
    } catch (error) {}
}

export async function downloadPDF(id, fileName) {
    try {
        return await api.get('/invoice/pdf/'+id, {responseType: 'blob'})
            .then(response => {
                let url = window.URL.createObjectURL(response.data)
                let a = document.createElement('a')
                a.href = url
                a.download = fileName
                a.click()
                a.remove()
                setTimeout(() => window.URL.revokeObjectURL(url), 100)
            })
    } catch (error) {}
}