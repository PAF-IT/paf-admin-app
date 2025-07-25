import {api} from './api'


export async function createBankrun(bankrun) {
    try {
        const result = await api.post('/bankrun/', bankrun)
        return result.data
    } catch (error) {}
}

export async function updateBankrun(bankrun) {
    try {
        const result = await api.put('/bankrun/'+bankrun.id, bankrun)
        return result.data
    } catch (error) {}
}

export async function getBankruns(page) {
    try {
        const result = await api.post('/bankruns/', {page: page, limit: 50})
        return result.data
    } catch (error) {}
}