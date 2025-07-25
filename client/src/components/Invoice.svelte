<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {
        createInvoice,
        downloadPDF,
        getInvoiceByName, getInvoiceByNumber,
        getInvoices,
        invoiceNames, invoiceNumberStrings,
        updateInvoice,
        deleteInvoice
    } from '../stores/invoice'
    import InfiniteScroll from 'svelte-infinite-scroll'
    import UIkit from 'uikit'
    import {screenWidthS, screenWidthL, screenWidthM} from '../stores/navigation'
    import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete'
    import InvoiceForm from './InvoiceForm.svelte'
    import {DateTime} from 'luxon'


    let page = 1
    let maxPage = 2
    let data = []
    let newBatch = []
    let autocompleteData = []
    let selectedInvoice
    let editInvoice = false
    let recreateForm = false

    $: data = [...data, ...newBatch]

    const dispatch = createEventDispatcher()

    onMount(async ()=> {

        await fetchData()
        autocompleteData = [...$invoiceNumberStrings, ...$invoiceNames]

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
                        if ($invoiceNumberStrings.findIndex(number => number === input) > -1)
                            fetchInvoice({invoice_nr: input})
                        if ($invoiceNames.findIndex(name => name === input) > -1)
                            fetchInvoice({name: input})
                    },
                    keyup: () => {
                        if (autoCompleteJS.input.value === '')
                            fetchInvoice(null)
                    }
                }
            }
        })
    })

    async function fetchData() {
        const response = await getInvoices(page)
        maxPage = response.meta.last_page
        newBatch = await response.data
    }

    async function fetchInvoice(queryField) {
        if (queryField !== null) {
            newBatch = []
            if (queryField.invoice_nr)
                data = [... await getInvoiceByNumber(queryField.invoice_nr)]
            if (queryField.name)
                data = [... await getInvoiceByName(queryField.name)]
        } else {
            data = []
            page = 1
            await fetchData()
        }
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'invoice'
        })
    }

    function openForm(invoice) {
        dispatch('message', {
            reload: 'settings'
        })
        selectedInvoice = invoice instanceof MouseEvent ? null : JSON.parse(JSON.stringify(invoice))
        editInvoice = selectedInvoice !== null
        recreateForm = !recreateForm
        UIkit.modal("#modal-full").show()
    }

    async function processInvoice(event) {
        if (event.detail.goto !== undefined) {
            switch (event.detail.goto) {
                case 'cancel':
                    UIkit.modal("#modal-full").hide()
                    break
                case 'save':

                    const sendMail = event.detail.sendMail ? event.detail.sendMail : false
                    let invoiceSuccess

                    if (!editInvoice)
                        invoiceSuccess = await createInvoice(selectedInvoice)
                    else if (selectedInvoice.id !== undefined && selectedInvoice.id !== null)
                        invoiceSuccess = await updateInvoice(selectedInvoice, sendMail)

                    if (invoiceSuccess?.id)
                        UIkit.notification('<span uk-icon="icon: check"></span> Invoice ' + (editInvoice ? 'updated!' : 'created!'), {status:'success', pos: 'bottom-center'})
                    else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
                    if (invoiceSuccess?.mail)
                        UIkit.notification('<span uk-icon="icon: check"></span> Email sent!', {status:'success', pos: 'bottom-center'})

                    if (invoiceSuccess && invoiceSuccess.number !== selectedInvoice.invoice_nr)
                        alert('Invoice number has changed to ' + invoiceSuccess.number + '!\nPlease correct in payment sheet if this is an in-house payment!')

                    UIkit.modal("#modal-full").hide()
                    dispatchReload()
                    break
                case 'delete':
                    const success = await deleteInvoice(selectedInvoice.id)
                    if (success) {
                        UIkit.modal("#modal-full").hide()
                        UIkit.notification('<span uk-icon="icon: check"></span> Successfully deleted', {status:'success', pos: 'bottom-center'});
                    } else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'});
                    dispatchReload()
                    break
            }
        }
    }

    function download(invoice) {
        downloadPDF(invoice.id, invoice.pdf_path)
    }
</script>

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' : ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}" id="autocomplete" type="search" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off" maxlength="256">
            <button on:click={openForm} class="uk-button uk-button-small uk-button-primary  uk-margin-large-left"><span uk-icon="icon: plus; ratio: 0.6"></span>{$screenWidthS? '' : $screenWidthM ? '\xa0invoice' : '\xa0New invoice'}</button>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center" style="max-height: 75%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#if data.length === 0}
            Loading invoices...
        {:else }
            <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                <thead>
                <tr>
                    <th class="uk-table-shrink uk-text-nowrap">Invoice Nr</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th class="uk-visible@m">Stay</th>
                    <th>Type</th>
                    <th class="uk-visible@s uk-table-shrink uk-text-nowrap">Amount</th>
                    <th class="uk-visible@s uk-table-shrink uk-text-nowrap">PDF</th>
                </tr>
                </thead>
                <tbody>
                {#each data as invoice}
                    <tr class="uk-table-link">
                        <td on:click={() => openForm(invoice)}>{invoice.invoice_nr}</td>
                        <td on:click={() => openForm(invoice)}>{DateTime.fromSQL(invoice.date).toFormat('dd LLL yyyy')}</td>
                        <td on:click={() => openForm(invoice)}>{invoice.name}</td>
                        <td on:click={() => openForm(invoice)} class="uk-visible@m">{invoice.stay_start !== null && invoice.stay_end !== null ? (DateTime.fromSQL(invoice.stay_start).toFormat('dd LLL yyyy') + ' - ' + DateTime.fromSQL(invoice.stay_end).toFormat('dd LLL yyyy')) : ' — '}</td>
                        <td><span class="uk-label uk-margin-remove uk-background-secondary">{invoice.payment_type}</span></td>
                        <td class="uk-visible@s" on:click={() => openForm(invoice)}>{invoice.total_amount}</td>
                        <td class="uk-visible@s">
                            {#if invoice.pdf_path !== null}
                                <a on:click={() => download(invoice)} href="{'#'}" uk-icon="file-pdf"> </a>
                            {/if}
                        </td>
                    </tr>
                {/each}
                </tbody>
            </table>
        {/if}
    </div>
    <InfiniteScroll hasMore={newBatch.length} threshold={80} on:loadMore={() => {
        if (page < maxPage) {
            page++
            fetchData()
        }
    }} />
</div>

<!-- INVOICE form modal -->

<div id="modal-full"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateForm}
                    <InvoiceForm bind:invoice={selectedInvoice} bind:edit={editInvoice} on:message={processInvoice} />
                {/key}
            </div>
        </div>
    </div>
</div>