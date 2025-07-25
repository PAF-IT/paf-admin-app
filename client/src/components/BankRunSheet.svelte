<script>
    import {DateTime} from 'luxon'
    import {afterUpdate, createEventDispatcher, onMount} from 'svelte'
    import {getAllBankRunInvoices, getBankRunInvoices} from '../stores/invoice'
    import {createBankrun, updateBankrun} from '../stores/bankrun'
    import UIkit from 'uikit'
    import flatpickr from 'flatpickr'

    export let bankRun = null

    let data = []
    let selected = new Set()
    let printData = []
    let printTotalCash = 0
    let printTotalCheque = 0
    let canPrint = false
    let didPrint = false

    const dispatch = createEventDispatcher()


    onMount(async() => {
        data = []
        if (bankRun)
            data = await getBankRunInvoices(bankRun.invoices)
        const invoices = await getAllBankRunInvoices()
        if (invoices)
            data = [...data, ... invoices]

        flatpickr('#form-date', {
            monthSelectorType: 'static',
            defaultDate: DateTime.now().toSQLDate()
        })
    })

    afterUpdate(() => setTimeout(() => {
        if (bankRun) {
            bankRun.invoices.forEach(i => {
                selected.add(i)
                document.getElementById(i).checked = true
                document.getElementById('tr-' + i).classList.add('uk-text-emphasis')
                document.getElementById('tr-' + i).classList.remove('uk-text-muted')
            })
        }
        canPrint = selected.size > 0
    }, 100))

    function select(invoiceNr) {
        if (document.getElementById(invoiceNr).checked) {
            selected.add(invoiceNr)
            document.getElementById('tr-' + invoiceNr).classList.add('uk-text-emphasis')
            document.getElementById('tr-' + invoiceNr).classList.remove('uk-text-muted')
        } else {
            selected.delete(invoiceNr)
            document.getElementById('tr-' + invoiceNr).classList.add('uk-text-muted')
            document.getElementById('tr-' + invoiceNr).classList.remove('uk-text-emphasis')
        }
        canPrint = selected.size > 0
    }

    function updatePrintData() {
        printData = data.filter(i => selected.has(i.invoice_nr))
        printTotalCash = printData.filter(i => i.payment_type === 'cash').reduce((prev, i) => prev + i.total_amount, 0)
        printTotalCheque = printData.filter(i => i.payment_type === 'cheque').reduce((prev, i) => prev + i.total_amount, 0)
    }

    async function print() {
        updatePrintData()
        window.setTimeout(() => {
            let printWindow = window.open('', '', 'left='+(window.innerWidth/2-300)+', top=200, height=800, width=600')
            printWindow.document.write('<html>')
            printWindow.document.write('<link rel="stylesheet" href="/build/bundle.css">')
            printWindow.document.write('<body onload="window.print()" onafterprint="window.close()">')
            printWindow.document.write(document.getElementById('print').innerHTML)
            printWindow.document.write('</body></html>')
            printWindow.document.close()
            didPrint = true
        }, 0)
    }

    async function close() {
        if ((didPrint || bankRun) && confirm('Save this bank-run?')) {
            updatePrintData()
            const bankrun = {
                date: document.getElementById('form-date').value,
                invoices: [... selected],
                total_amount_cash: printTotalCash,
                total_amount_cheque: printTotalCheque
            }
            if (bankRun) {
                bankrun.id = bankRun.id
                if (await updateBankrun(bankrun))
                    UIkit.notification('<span uk-icon="icon: check"></span> Bankrun saved!', {status: 'success', pos: 'bottom-center'})
                else
                    UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
            } else {
                if ((bankRun && await updateBankrun(bankrun)) || (bankRun === null && await createBankrun(bankrun)))
                    UIkit.notification('<span uk-icon="icon: check"></span> Bankrun created!', {status: 'success', pos: 'bottom-center'})
                else
                    UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
            }
            bankRun = null
        }
        dispatch('message', {
            goto: 'cancel'
        })
    }
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-width-1-1">
    Bank deposit sheet
</h4>

<form>
    <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-medium-bottom">
        <input class="uk-input uk-form-width-medium" id="form-date" type="text" style="color: black">
        <button class="uk-button uk-button-default uk-margin-large-left" type="button" on:click={close}>{canPrint ? 'Close' : 'Cancel'}</button>
        <button class="uk-button uk-margin-large-left" type="submit" disabled={!canPrint} class:uk-button-primary={canPrint} on:click={print}>Print</button>
    </div>

    {#if data.length === 0}
        Loading invoices...
    {:else }
        <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
            <thead>
            <tr>
                <th></th>
                <th>Invoice</th>
                <th class="uk-visible@m">Date</th>
                <th>Name</th>
                <th>Type</th>
                <th class="uk-visible@s">Amount</th>
            </tr>
            </thead>
            <tbody>
            {#each data as invoice}
                <tr id="tr-{invoice.invoice_nr}" class="uk-text-muted">
                    <td class="uk-table-shrink"><input class="uk-checkbox" type="checkbox" id="{invoice.invoice_nr}" on:click={() => select(invoice.invoice_nr)}></td>
                    <td class="uk-table-shrink">{invoice.invoice_nr}</td>
                    <td class="uk-table-shrink uk-text-nowrap uk-visible@m">{DateTime.fromSQL(invoice.date).toFormat('dd LLL yyyy')}</td>
                    <td>{invoice.name}</td>
                    <td class="uk-table-shrink"><span class="uk-label uk-margin-remove uk-background-secondary">{invoice.payment_type}</span></td>
                    <td class="uk-table-shrink uk-visible@s">{invoice.total_amount}</td>
                </tr>
            {/each}
            </tbody>
        </table>
    {/if}
</form>



<!-- HIDDEN PRINT DIV -->

<div id="print" hidden="hidden">
    <table class="uk-table uk-table-small uk-table-divider uk-text-small">
        <thead>
        <tr>
            <th class="uk-text-nowrap">Invoice Nr</th>
            <th>Date</th>
            <th>Name</th>
            <th>Stay</th>
            <th class="uk-text-nowrap">Cash</th>
            <th class="uk-text-nowrap">Cheque</th>
        </tr>
        </thead>
        <tbody>
        {#each printData as invoice}
            <tr>
                <td class="uk-table-shrink">{invoice.invoice_nr}</td>
                <td class="uk-table-shrink uk-text-nowrap">{DateTime.fromSQL(invoice.date).toFormat('dd LLL yyyy')}</td>
                <td>{invoice.name}</td>
                <td class="uk-text-nowrap">{invoice.stay_start !== null && invoice.stay_end !== null ? (DateTime.fromSQL(invoice.stay_start).toFormat('dd LLL yyyy') + ' - ' + DateTime.fromSQL(invoice.stay_end).toFormat('dd LLL yyyy')) : ' — '}</td>
                <td class="uk-table-shrink">{invoice.payment_type === 'cash' ? invoice.total_amount : ''}</td>
                <td class="uk-table-shrink">{invoice.payment_type === 'cheque' ? invoice.total_amount : ''}</td>
            </tr>
        {/each}
        <tr style="border-top: 2px solid rgb(204, 204, 204); border-bottom: 4px double;">
            <td class="uk-text-bold">TOTAL</td>
            <td></td>
            <td></td>
            <td></td>
            <td class="uk-text-bold">{printTotalCash}</td>
            <td class="uk-text-bold">{printTotalCheque}</td>
        </tr>
        </tbody>
    </table>
</div>