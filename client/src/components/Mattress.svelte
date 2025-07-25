<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {DateTime} from 'luxon'
    import {screenWidthL, screenWidthM, screenWidthS, screenWidthXL} from '../stores/navigation'
    import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete'
    import {createBooking, updateBooking, deleteBooking, getBookingsByIds} from '../stores/booking'
    import {
        mattressNames,
        getAccounts,
        getAllocatedNights,
        getIncome,
        getTransactions,
        accounts,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        allocatedNights,
        income
    } from '../stores/mattress'
    import InfiniteScroll from 'svelte-infinite-scroll'
    import UIkit from 'uikit'
    import MattressForm from './MattressForm.svelte'


    let data = []
    let newBatch = []
    let maxPage = 2
    let transactionCounts = {}
    let tab = 'debit'
    let transactionQuery = {
        page: 1,
        limit: 50,
        transaction: tab
    }
    let transactionName = null
    let creditShowOnlyMattress = true
    let selectedTransaction = null
    let editTransaction = false
    let selectedBooking = null
    let recreateForm = false

    $: data = [...data, ...newBatch]

    const dispatch = createEventDispatcher()

    onMount(async () => {

        await getAccounts()
        await getAllocatedNights()
        await getIncome()
        await fetchData()

        const autoCompleteJS = new autoComplete({
            selector: "#autocomplete",
            placeHolder: "Search allocations...",
            diacritics: true,
            searchEngine: 'strict',
            data: {
                src: $mattressNames,
                cache: true,
            },
            resultsList: {
                element: (list, data) => {
                    if (!data.results.length) {
                        const message = document.createElement("div")
                        message.setAttribute("class", "no_result")
                        message.innerHTML = `<span>No Allocation for "${data.query}"</span>`
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
                        autoCompleteJS.input.value = event.detail.selection.value
                        transactionName = event.detail.selection.value
                        fetchTransaction()
                    },
                    keyup: () => {
                        if (autoCompleteJS.input.value === '') {
                            transactionName = null
                            fetchTransaction()
                        }
                    }
                }
            }
        })
    })

    async function fetchData() {
        const result = await getTransactions(transactionQuery)
        maxPage = result.meta.last_page
        newBatch = result.data
        processCounts(result.counts)
    }

    async function fetchTransaction() {
        transactionQuery.page = 1
        newBatch = []
        if (transactionName !== null) {
            transactionQuery.name = transactionName
            const result = await getTransactions(transactionQuery)
            maxPage = result.meta.last_page
            data = result.data
            processCounts(result.counts)
        } else {
            delete transactionQuery.name
            data = []
            await fetchData()
        }
    }

    function processCounts(counts) {
        transactionCounts = {
            credit_all: counts.filter(c => c.transaction === 'credit').reduce((acc, c) => acc + c['COUNT(*)'], 0),
            credit_mat: counts.filter(c => c.transaction === 'credit' && c.type !== 'stay' && c.type !== 'membership').reduce((acc, c) => acc + c['COUNT(*)'], 0),
            debit: counts.filter(c => c.transaction === 'debit').reduce((acc, c) => acc + c['COUNT(*)'], 0),
            reserve: counts.filter(c => c.transaction === 'reserve').reduce((acc, c) => acc + c['COUNT(*)'], 0)
        }
    }

    function switchTab(selection, qualifier) {
        tab = selection
        creditShowOnlyMattress = qualifier === 'mattress'
        transactionQuery.creditShowOnlyMattress = creditShowOnlyMattress
        transactionQuery.transaction = tab
        transactionQuery.page = 1
        fetchTransaction()
    }

    async function openForm(transaction) {

        if (transaction.type === 'stay' || transaction.type === 'membership')
            return

        selectedTransaction = transaction instanceof MouseEvent ? null : JSON.parse(JSON.stringify(transaction))
        selectedBooking = null

        if (selectedTransaction?.booking_id) {
            selectedBooking = await getBookingsByIds([selectedTransaction.booking_id])
            selectedBooking = selectedBooking[0]
            selectedBooking.paf_events = selectedBooking.paf_events !== null ? JSON.parse(selectedBooking.paf_events) : selectedBooking.paf_events
        }

        editTransaction = selectedTransaction != null
        recreateForm = !recreateForm
        UIkit.modal("#modal-transaction").show()
    }

    async function processTransaction(event) {
        if (event.detail.goto !== undefined) {
            let success = false
            switch (event.detail.goto) {
                case 'cancel':
                    UIkit.modal("#modal-transaction").hide()
                    break
                case 'save':
                    if (event.detail.booking !== null) {
                        let bookingId = 0
                        if (!editTransaction)
                            bookingId = await createBooking(event.detail.booking)
                        else
                            bookingId = await updateBooking(event.detail.booking)
                        if (bookingId > 0) {
                            if (!editTransaction)
                                selectedTransaction.booking_id = bookingId
                            if (event.detail.booking.stay_days)
                                selectedTransaction.booking_nights = event.detail.booking.stay_days
                            UIkit.notification('<span uk-icon="icon: check"></span> Booking successfully ' + (editTransaction ? 'updated!' : 'created!'), {status: 'success', pos: 'bottom-center'})
                        }
                        else
                            UIkit.notification('<span uk-icon="icon: warning"></span> Booking failed!', {status: 'danger', pos: 'bottom-center'})
                    }
                    if (!editTransaction)
                        success = await createTransaction(selectedTransaction)
                    else if (selectedTransaction.id !== undefined && selectedTransaction.id !== null)
                        success = await updateTransaction(selectedTransaction)
                    if (success) {
                        UIkit.modal("#modal-transaction").hide()
                        UIkit.notification('<span uk-icon="icon: check"></span> Successfully ' + (editTransaction ? 'updated!' : 'created!'), {status:'success', pos: 'bottom-center'})
                    } else {
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
                    }
                    if (selectedTransaction)
                        dispatchReload()
                    break
                case 'delete':
                    if (selectedTransaction.booking_id !== null && selectedTransaction.booking_id > 0) {
                        success = await deleteBooking(selectedTransaction.booking_id)
                        if (success)
                            UIkit.notification('<span uk-icon="icon: check"></span> Booking uccessfully deleted', {status:'success', pos: 'bottom-center'})
                        else
                            UIkit.notification('<span uk-icon="icon: warning"></span> Booking failed to delete!', {status: 'danger', pos: 'bottom-center'})
                        success = false
                    }
                    success = await deleteTransaction(selectedTransaction.id)
                    if (success) {
                        UIkit.modal("#modal-transaction").hide()
                        UIkit.notification('<span uk-icon="icon: check"></span> Successfully deleted', {status:'success', pos: 'bottom-center'})
                    } else {
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
                    }
                    dispatchReload()
                    break
            }
        }
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'mattress'
        })
    }

</script>

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' : ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}" id="autocomplete" type="search" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off" maxlength="256">
            <button on:click={openForm} class="uk-button uk-button-small uk-button-primary uk-margin-large-left"><span uk-icon="icon: plus; ratio: 0.6"></span>{$screenWidthS? '' : $screenWidthM ? '\xa0transaction' : '\xa0New transaction'}</button>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center" style="max-height: 75%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">

        <div class="uk-flex uk-flex-center">
            <div class="uk-width-small">
                <div class="uk-margin-medium uk-padding-small uk-text-center uk-text-bold uk-label-success uk-light" class:uk-label-warning={$accounts.mattress_balance < 100} class:uk-label-danger={$accounts.mattress_balance <= 0} class:uk-text-small={$screenWidthS}>
                    <span class="uk-text-large" style="color: white">{$accounts.mattress_balance} €</span><br>
                    Balance
                </div>
            </div>
            <div class="uk-width-small uk-margin-large-left">
                <div class="uk-margin-medium uk-padding-small uk-text-center uk-text-bold uk-light" class:uk-text-small={$screenWidthS} style="background-color: #999999">
                    <span class="uk-text-large" style="color: white">{$accounts.mattress_reserved} €</span><br>
                    Planned
                </div>
            </div>
            <div class="uk-width-auto uk-margin-large-left">
                <div class="uk-margin-medium uk-padding-small uk-background-primary uk-text-center uk-text-bold uk-light" class:uk-text-small={$screenWidthS}>
                    <span class="uk-text-large" style="color: white">{$allocatedNights.nights}</span><br>
                    Nights allocated
                </div>
            </div>
            <div class="uk-width-auto uk-margin-large-left">
                <div class="uk-margin-medium uk-padding-small uk-label-success uk-text-center uk-text-bold uk-light" class:uk-text-small={$screenWidthS}>
                    <span class="uk-text-large" style="color: white">{$income.income} €</span><br>
                    Income {DateTime.now().year}
                </div>
            </div>
        </div>

        <div class="uk-flex uk-flex-center">
            <ul uk-tab>
                <li class="uk-active"><a href={"#"} on:click={() => switchTab('debit')}>Allocated
                    {#if tab === 'debit'}
                        &nbsp; <span class="uk-badge">{transactionCounts?.debit}</span>
                    {:else}
                        &nbsp; <span class="uk-badge" style={transactionCounts?.debit > 0 ? 'background-color: #999999' : 'background-color: #cccccc'}>{transactionCounts?.debit}</span>
                    {/if}
                </a></li>
                <li><a href={"#"} on:click={() => switchTab('reserve')}>Planned
                    {#if tab === 'reserve'}
                        &nbsp; <span class="uk-badge">{transactionCounts?.reserve}</span>
                    {:else}
                        &nbsp; <span class="uk-badge" style={transactionCounts?.reserve > 0 ? 'background-color: #999999' : 'background-color: #cccccc'}>{transactionCounts?.reserve}</span>
                    {/if}
                </a></li>
                <li>
                    <a href>Income
                        {#if tab === 'credit'}
                            &nbsp; <span class="uk-badge">{transactionCounts?.credit_mat}</span>
                        {:else}
                            &nbsp; <span class="uk-badge" style={transactionCounts?.credit_all > 0 ? 'background-color: #999999' : 'background-color: #cccccc'}>{transactionCounts?.credit_mat}</span>
                        {/if}
                        <span uk-icon="icon: triangle-down"></span>
                    </a>
                    <div uk-dropdown="mode: click">
                        <ul class="uk-nav uk-dropdown-nav">
                            <li><a href={"#"} on:click={() => switchTab('credit', 'mattress')}>Mattress administrated
                                {#if tab === 'credit' && creditShowOnlyMattress}
                                    &nbsp; <span class="uk-badge">{transactionCounts?.credit_mat}</span>
                                {:else}
                                    &nbsp; <span class="uk-badge" style={transactionCounts?.credit_mat > 0 ? 'background-color: #999999' : 'background-color: #cccccc'}>{transactionCounts?.credit_mat}</span>
                                {/if}
                            </a></li>
                            <li><a href={"#"} on:click={() => switchTab('credit', 'all')}>All income
                                {#if tab === 'credit' && !creditShowOnlyMattress}
                                    &nbsp; <span class="uk-badge">{transactionCounts?.credit_all}</span>
                                {:else}
                                    &nbsp; <span class="uk-badge" style={transactionCounts?.credit_all > 0 ? 'background-color: #999999' : 'background-color: #cccccc'}>{transactionCounts?.credit_all}</span>
                                {/if}
                            </a></li>
                        </ul>
                    </div>
                </li>
            </ul>
        </div>

        <div class="uk-width-1-1">
            {#if data.length === 0 && transactionQuery.name}
                No filter results...
            {:else if data.length === 0}
                Loading allocations...
            {:else }
                <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th class="uk-width-small">Allocator</th>
                        <th class="uk-width-small">Name</th>
                        <th class="uk-width-small uk-table-shrink">Type</th>
                        <th class="uk-visible@m">Description</th>
                        <th class="uk-table-shrink">Nights</th>
                        <th class="uk-table-shrink">Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each data as transaction}
                        {#if !creditShowOnlyMattress || (creditShowOnlyMattress && transaction.type !== 'stay' && transaction.type !== 'membership')}
                            <tr class="uk-table-link" class:uk-text-muted={transaction.type === 'stay' || transaction.type === 'membership'}>
                                <td on:click={() => openForm(transaction)} class="uk-table-shrink uk-text-nowrap">{DateTime.fromSQL(transaction.date).toFormat('dd LLL yyyy')}</td>
                                <td on:click={() => openForm(transaction)} class="uk-table-shrink uk-text-nowrap">{transaction.allocator}</td>
                                <td on:click={() => openForm(transaction)} class="uk-table-shrink uk-text-nowrap">{transaction.name}</td>
                                <td on:click={() => openForm(transaction)} class="uk-table-shrink uk-text-nowrap">{transaction.type}</td>
                                <td on:click={() => openForm(transaction)} class="uk-visible@m uk-text-truncate" >{transaction.type === 'stay' || transaction.type === 'membership' ? 'automated (system)' : transaction.description}</td>
                                <td on:click={() => openForm(transaction)}>{transaction.booking_nights ? transaction.booking_nights : ''}</td>
                                <td on:click={() => openForm(transaction)}>{transaction.amount}</td>
                            </tr>
                        {/if}
                    {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>
    <InfiniteScroll hasMore={newBatch.length} threshold={80} on:loadMore={() => {
        if (transactionQuery.page < maxPage) {
            transactionQuery.page++
            fetchData()
        }
    }} />
</div>

<!-- TRANSACTION form modal -->

<div id="modal-transaction"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>
                {#key recreateForm}
                    <MattressForm bind:balance={$accounts.mattress_balance} bind:transaction={selectedTransaction} bind:booking={selectedBooking} on:message={processTransaction} />
                {/key}
            </div>
        </div>
    </div>
</div>