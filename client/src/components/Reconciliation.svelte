<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import InfiniteScroll from 'svelte-infinite-scroll'
    import * as SimpleSwitch from 'a-simple-switch'
    import {screenWidthL, screenWidthM, screenWidthS} from '../stores/navigation'
    import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete'
    import {DateTime} from 'luxon'
    import {
        getReconciliationInvoices,
        invoiceNames, invoiceNumberStrings, invoiceReconciliationNumbers,
        updateInvoice
    } from '../stores/invoice'
    import flatpickr from 'flatpickr'
    import UIkit from 'uikit'
    import {updateBookingPaid} from '../stores/booking'


    let maxPage = 2
    let data = []
    let newBatch = []
    let autocompleteData = []
    let invoiceQuery = {
        filter: {
            date: [DateTime.now().minus({years: 1}).toSQLDate(), DateTime.now().toSQLDate()],
            paid: false
        },
        page: 1,
        limit: 50,
        orderBy: {
            key: 'invoice_nr',
            order: 'ASC'
        }
    }
    let datePicker
    let paidDates = {}
    let recreateForm = true

    $: data = [...data, ...newBatch]

    const dispatch = createEventDispatcher()

    onMount(async () => {

        await fetchData()
        autocompleteData = [...$invoiceReconciliationNumbers, ...$invoiceNames]

        SimpleSwitch.init()

        const autoCompleteJS = new autoComplete({
            selector: "#autocomplete",
            placeHolder: "Search invoices...",
            diacritics: true,
            searchEngine: 'strict',
            data: {
                src: autocompleteData,
                cache: true,
            },
            resultsList: {
                element: (list, data) => {
                    if (!data.results.length) {
                        const message = document.createElement("div")
                        message.setAttribute("class", "no_result")
                        message.innerHTML = `<span>No Invoice for "${data.query}"</span>`
                        list.prepend(message)
                    }
                },
                maxResults: 50,
                noResults: true
            },
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        let input = event.detail.selection.value
                        autoCompleteJS.input.value = input
                        delete invoiceQuery.invoice_nr
                        delete invoiceQuery.name
                        if ($invoiceNumberStrings.findIndex(number => number === input) > -1)
                            invoiceQuery.invoice_nr = input
                        if ($invoiceNames.findIndex(name => name === input) > -1)
                            invoiceQuery.name = input
                        fetchInvoices(true)
                    },
                    keyup: () => {
                        if (autoCompleteJS.input.value === '')
                            fetchInvoices(false)
                    }
                }
            }
        })
    })

    async function fetchData() {
        const result = await getReconciliationInvoices(invoiceQuery)
        maxPage = result.meta.last_page
        newBatch = result.data
    }

    async function fetchInvoices(doQuery) {
        invoiceQuery.page = 1
        newBatch = []
        if (doQuery) {
            const result = await getReconciliationInvoices(invoiceQuery)
            maxPage = result.meta.last_page
            data = [...result.data]
        } else {
            delete invoiceQuery.invoice_nr
            delete invoiceQuery.name
            data = []
            await fetchData()
        }
    }

    function togglePaid() {
        invoiceQuery.filter.paid = !document.getElementById('paid').checked
        invoiceQuery.page = 1
        invoiceQuery.orderBy = {
            key: invoiceQuery.filter.paid ? 'invoice_nr' : 'invoice_nr',
            order: invoiceQuery.filter.paid ? 'DESC' : 'ASC'
        }
        paidDates = {}
        data = []
        newBatch = []
        fetchData()
    }

    function attachDatePicker(id) {
        datePicker = flatpickr('#date-'+id, {monthSelectorType: 'static'})
        if (document.getElementById('date-'+id).value?.length > 0)
            paidDates['date-' + id] = true
    }

    function removePaidDate(id) {
        if (document.getElementById('date-'+id).value?.length > 0)
            document.getElementById('date-'+id).value = ''
        paidDates['date-' + id] = false
    }

    async function updatePaidDate(id) {
        let invoice = data.find(i => i.id === id)
        if (invoice) {
            const date_paid = document.getElementById('date-' + id).value
            invoice.date_paid = date_paid
            let success = await updateInvoice(invoice, false)
            if (invoice.stay_start)
                success = await updateBookingPaid(invoice.id, date_paid) && success
            if (success) {
                UIkit.notification('<span uk-icon="icon: check"></span> Invoice updated!', {status: 'success', pos: 'bottom-center'})
                paidDates = {}
                data = []
                newBatch = []
                await fetchData()
            }
            else
                UIkit.notification('<span uk-icon="icon: warning"></span> Failed updating invoice!', {status: 'danger', pos: 'bottom-center'})
        }
    }
</script>


<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center uk-flex-middle">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' : ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}"
                   id="autocomplete" type="search" spellCheck=false autoCorrect="off" autoComplete="off"
                   autoCapitalize="off" maxLength="256">
            <div class="uk-margin-left"><input type="checkbox" id="paid" data-type="simple-switch"
                                               on:change={togglePaid} checked/> {invoiceQuery.filter.paid ? 'Paid' : 'Unpaid'}</div>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center" style="max-height: 75%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#if data.length === 0 && (invoiceQuery.filter || invoiceQuery.name)}
            No filter results...
        {:else if data.length === 0}
            Loading invoices...
        {:else }
            <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                <thead>
                <tr>
                    <th>Invoice</th>
                    <th class="uk-visible@m">Date</th>
                    <th>Name</th>
                    <th class="uk-visible@l">Stay</th>
                    <th>Type</th>
                    <th class="uk-visible@s">Amount</th>
                    <th>Paid</th>
                </tr>
                </thead>
                <tbody>
                {#each data as invoice}
                    <tr>
                        <td class="uk-table-shrink">{invoice.invoice_nr}</td>
                        <td class="uk-table-shrink uk-text-nowrap uk-visible@m">{DateTime.fromSQL(invoice.date).toFormat('dd LLL yyyy')}</td>
                        <td>{invoice.name}</td>
                        <td class="uk-visible@l">{(invoice.stay_start ? DateTime.fromSQL(invoice.stay_start).toFormat('dd LLL yyyy') : '') + ' - ' + (invoice.stay_end ? DateTime.fromSQL(invoice.stay_end).toFormat('dd LLL yyyy') : '')}</td>
                        <td class="uk-table-shrink"><span class="uk-label uk-margin-remove uk-background-secondary">{invoice.payment_type}</span></td>
                        <td class="uk-table-shrink uk-visible@s">{invoice.total_amount}</td>
                        {#if !invoiceQuery.filter.paid}
                            <td class="uk-table-shrink uk-text-nowrap">
                                <input class="uk-input uk-form-width-small uk-form-small" id="date-{invoice.id}" type="text" style="color: black" on:focus={attachDatePicker(invoice.id)}>
                                {#if paidDates['date-' + invoice.id]}
                                    <button class="uk-button uk-button-small uk-button-primary uk-margin-small-left" type="button" on:click={() => updatePaidDate(invoice.id)}><span uk-icon="check"></span></button>
                                    <button class="uk-button uk-button-small uk-button-default uk-margin-small-left uk-margin-medium-right" type="button" on:click={() => removePaidDate(invoice.id)}><span uk-icon="close"></span></button>
                                {/if}
                            </td>
                        {:else}
                            <td class="uk-table-shrink uk-text-nowrap">{invoice.date_paid !== null ? DateTime.fromSQL(invoice.date_paid).toFormat('dd LLL yyyy') : ''}</td>
                        {/if}
                    </tr>
                {/each}
                </tbody>
            </table>
        {/if}
    </div>
    <InfiniteScroll hasMore={newBatch.length} threshold={80} on:loadMore={() => {
        if (invoiceQuery.page < maxPage) {
            invoiceQuery.page++
            fetchData()
        }
    }}/>
</div>