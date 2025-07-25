<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {
        bookingNames,
        getBookings,
        createBooking,
        updateBooking,
        getGroupNames, deleteBooking, calculateBookingAmounts
    } from '../stores/booking'
    import InfiniteScroll from 'svelte-infinite-scroll'
    import UIkit from 'uikit'
    import BookingForm from './BookingForm.svelte'
    import {screenWidthL, screenWidthM, screenWidthS} from '../stores/navigation'
    import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete'
    import {DateTime} from 'luxon'
    import {events} from '../stores/event'
    import {getTransactionsByBookingId, updateTransaction} from '../stores/mattress'


    const State = Object.freeze({
        none: 'none',
        asc: 'ASC',
        desc: 'DESC'
    });

    let maxPage = 2
    let data = []
    let newBatch = []
    let groupNames = []
    let bookingQuery = {
        page: 1,
        limit: 50
    }
    let orderStates = {
        arrival: State.none,
        departure: State.none
    }
    let selectedBooking
    let editBooking = false
    let recreateForm = false

    $: data = [...data, ...newBatch]

    const dispatch = createEventDispatcher()

    onMount(async () => {

        await fetchData()
        groupNames = await getGroupNames()

        const autoCompleteJS = new autoComplete({
            selector: "#autocomplete",
            placeHolder: "Search bookings...",
            diacritics: true,
            searchEngine: 'strict',
            data: {
                src: $bookingNames,
                cache: true,
            },
            resultsList: {
                element: (list, data) => {
                    if (!data.results.length) {
                        const message = document.createElement("div")
                        message.setAttribute("class", "no_result")
                        message.innerHTML = `<span>No Booking for "${data.query}"</span>`
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
                        fetchBooking(event.detail.selection.value)
                    },
                    keyup: () => {
                        if (autoCompleteJS.input.value === '')
                            fetchBooking(null)
                    }
                }
            }
        })
    })

    async function fetchData() {
        const result = await getBookings(bookingQuery)
        maxPage = result.meta.last_page
        newBatch = result.data
    }

    async function fetchBooking(bookingName) {
        bookingQuery.page = 1
        newBatch = []
        if (bookingName !== undefined && bookingName !== null) {
            bookingQuery.name = bookingName
            const result = await getBookings(bookingQuery)
            maxPage = result.meta.last_page
            data = [... result.data]
        } else {
            delete bookingQuery.name
            data = []
            await fetchData()
        }
    }

    function switchOrderBy(col) {

        // TODO: simplify by removing orderStates working only with bookingQuery.orderBy

        switch (col) {
            case 'arrival':
                orderStates.arrival = orderStates.arrival !== State.desc ? State.desc : State.asc
                orderStates.departure = State.none
                bookingQuery.orderBy = {
                    key: 'arrival',
                    order: orderStates.arrival
                }
                break
            case 'departure':
                orderStates.departure = orderStates.departure !== State.desc ? State.desc : State.asc
                orderStates.arrival = State.none
                bookingQuery.orderBy = {
                    key: 'departure',
                    order: orderStates.departure
                }
                break
            case null:
                orderStates.arrival = State.none
                orderStates.departure = State.none
                delete bookingQuery.orderBy
        }
        fetchBooking(bookingQuery.name)
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'booking'
        })
    }

    function openForm(booking) {
        selectedBooking = booking instanceof MouseEvent ? null : JSON.parse(JSON.stringify(booking))
        editBooking = selectedBooking !== null
        recreateForm = !recreateForm
        UIkit.modal("#modal-booking").show()
    }

    async function processBooking(event) {
        if (event.detail.goto !== undefined) {
            let success = false
            switch (event.detail.goto) {
                case 'cancel':
                    UIkit.modal("#modal-booking").hide()
                    break
                case 'save':
                    if (!editBooking)
                        success = await createBooking(selectedBooking) > 0
                    else if (selectedBooking.id !== undefined && selectedBooking.id !== null) {
                        if (selectedBooking.mattress_booking) {
                            let transaction = await getTransactionsByBookingId(selectedBooking.id)
                            selectedBooking = calculateBookingAmounts(selectedBooking)
                            transaction.amount = selectedBooking.total_amount
                            transaction.booking_nights = selectedBooking.stay_days
                            success = await updateTransaction(transaction)
                            if (success)
                                UIkit.notification('<span uk-icon="icon: check"></span> Successfully updated mattress!', {status:'success', pos: 'bottom-center'});
                            else
                                UIkit.notification('<span uk-icon="icon: warning"></span> Failed updating mattress!', {status: 'danger', pos: 'bottom-center'});
                            success = false
                        }
                        success = await updateBooking(selectedBooking)
                    }
                    if (success) {
                        UIkit.modal("#modal-booking").hide()
                        UIkit.notification('<span uk-icon="icon: check"></span> Successfully ' + (editBooking ? 'updated!' : 'created!'), {status:'success', pos: 'bottom-center'});
                    } else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'});
                    if (selectedBooking)
                        dispatchReload()
                    break
                case 'delete':
                    success = await deleteBooking(selectedBooking.id)
                    if (success) {
                        UIkit.modal("#modal-booking").hide()
                        UIkit.notification('<span uk-icon="icon: check"></span> Successfully deleted', {status:'success', pos: 'bottom-center'});
                    } else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'});
                    dispatchReload()
                    break
            }
        }
    }

    function setFilters(field) {

        bookingQuery.filter = {}

        if (field !== 'date_present' && document.getElementById('date_arrival').value !== '[]') {
            document.getElementById('date_present').value = '[]'
            bookingQuery.filter.arrival = JSON.parse(document.getElementById('date_arrival').value)
        }
        if (field !== 'date_arrival' && document.getElementById('date_present').value !== '[]') {
            document.getElementById('date_arrival').value = '[]'
            bookingQuery.filter.present = JSON.parse(document.getElementById('date_present').value)
        }
        if (field !== 'group' && document.getElementById('event').value > 0) {
            document.getElementById('group').value = ''
            bookingQuery.filter.event = Number(document.getElementById('event').value)
        }
        if (field !== 'event' && document.getElementById('group').value !== '') {
            document.getElementById('event').value = 0
            bookingQuery.filter.group = document.getElementById('group').value
        }

        if (document.getElementById('cancelled').checked)
            bookingQuery.filter.cancelled = true

        if (field === 'paid') {
            document.getElementById('not_paid').checked = false
            if (document.getElementById('paid').checked)
                bookingQuery.filter.paid = true
        }

        if (field === 'not_paid') {
            document.getElementById('paid').checked = false
            if (document.getElementById('not_paid').checked)
                bookingQuery.filter.paid = false
        }

        if (document.getElementById('longstayer').checked)
            bookingQuery.filter.longstayer = true

        data = []
        newBatch = []
        bookingQuery.page = 1

        fetchData()
    }

    function clearFilters() {
        document.getElementById('date_arrival').value = '[]'
        document.getElementById('date_present').value = '[]'
        document.getElementById('event').value = 0
        document.getElementById('group').value = ''
        document.getElementById('cancelled').checked = false
        document.getElementById('paid').checked = false
        document.getElementById('not_paid').checked = false
        document.getElementById('longstayer').checked = false

        bookingQuery.filter = {}
        data = []
        newBatch = []
        bookingQuery.page = 1

        fetchData()
    }
</script>

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' : ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}" id="autocomplete" type="search" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off" maxlength="256">
            <button class="uk-button uk-button-small uk-button-default uk-margin-left"  type="button"
                    class:uk-button-danger={bookingQuery.filter && Object.keys(bookingQuery.filter).length > 0}
                    class:uk-light={bookingQuery.filter && Object.keys(bookingQuery.filter).length > 0} >
                <span class="uk-text-muted" uk-icon="settings"></span>
            </button>
            <div uk-dropdown="mode: click">
                <ul class="uk-nav uk-dropdown-nav">
                    <li class="uk-margin-bottom">
                        <div class="uk-grid-small" uk-grid>
                            <div class="uk-width-1-1 uk-inline">
                                <span class="uk-nav-header">Filters</span> <span class="uk-position-center-right uk-text-meta"><a href="{'#'}" on:click={clearFilters} class="uk-link-reset"><span uk-icon="icon: close; ratio: 0.9"></span> Clear</a></span>
                            </div>
                        </div>
                    </li>
                    <li><select class="uk-select uk-margin-small-bottom" id="date_arrival" type="text" on:change={() => setFilters('date_arrival')}>
                        <option value="[]" selected>Arrival</option>
                        <option value="[]">-</option>
                        <option value={"[\""+DateTime.now().toSQLDate()+"\"]"}>Today</option>
                        <option value={"[\""+DateTime.now().toSQLDate()+"\", \""+DateTime.now().plus({weeks:1}).toSQLDate()+"\"]"}>Next week</option>
                        <option value={"[\""+DateTime.now().toSQLDate()+"\", \""+DateTime.now().plus({months:1}).toSQLDate()+"\"]"}>Next month</option>
                        <option value={"[\""+DateTime.now().minus({days:1}).toSQLDate()+"\"]"}>Yesterday</option>
                        <option value={"[\""+DateTime.now().minus({weeks:1}).toSQLDate()+"\", \""+DateTime.now().toSQLDate()+"\"]"}>Last week</option>
                        <option value={"[\""+DateTime.now().minus({months:1}).toSQLDate()+"\", \""+DateTime.now().toSQLDate()+"\"]"}>Last month</option>
                    </select></li>
                    <li><select class="uk-select uk-margin-small-bottom" id="date_present" type="text" on:change={() => setFilters('date_present')}>
                        <option value="[]" selected>Stay Period</option>
                        <option value="[]">-</option>
                        <option value={"[\""+DateTime.now().toSQLDate()+"\"]"}>Today</option>
                        <option value={"[\""+DateTime.now().toSQLDate()+"\", \""+DateTime.now().plus({weeks:1}).toSQLDate()+"\"]"}>Next week</option>
                        <option value={"[\""+DateTime.now().toSQLDate()+"\", \""+DateTime.now().plus({months:1}).toSQLDate()+"\"]"}>Next month</option>
                        <option value={"[\""+DateTime.now().minus({days:1}).toSQLDate()+"\"]"}>Yesterday</option>
                        <option value={"[\""+DateTime.now().minus({weeks:1}).toSQLDate()+"\", \""+DateTime.now().toSQLDate()+"\"]"}>Last week</option>
                        <option value={"[\""+DateTime.now().minus({months:1}).toSQLDate()+"\", \""+DateTime.now().toSQLDate()+"\"]"}>Last month</option>
                    </select></li>
                    <li><select class="uk-select uk-margin-small-bottom" id="event" type="text" on:change={() => setFilters('event')}>
                        <option value="0" selected>Event</option>
                        <option value="0">-</option>
                        {#each $events as event}
                            <option value={event.id}>{event.name}</option>
                        {/each}
                    </select></li>
                    <li><select class="uk-select uk-margin-small-bottom" id="group" type="text" on:change={() => setFilters('group')}>
                        <option value="" selected>Group</option>
                        <option value="">-</option>
                        {#each groupNames as group}
                            <option value={group}>{group}</option>
                        {/each}
                    </select></li>
                    <li><input class="uk-checkbox uk-margin-small-right" id="cancelled" type="checkbox" on:change={() => setFilters('cancelled')}> Cancelled</li>
                    <li><input class="uk-checkbox uk-margin-small-right" id="paid" type="checkbox" on:change={() => setFilters('paid')}> Paid</li>
                    <li><input class="uk-checkbox uk-margin-small-right" id="not_paid" type="checkbox" on:change={() => setFilters('not_paid')}> Not paid</li>
                    <li><input class="uk-checkbox uk-margin-small-right" id="longstayer" type="checkbox" on:change={() => setFilters('longstayer')}> Longstayer</li>
                </ul>
            </div>
            <button on:click={openForm} class="uk-button uk-button-small uk-button-primary uk-margin-left"><span uk-icon="icon: plus; ratio: 0.6"></span>{$screenWidthS? '' : $screenWidthM ? '\xa0booking' : '\xa0New booking'}</button>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center" style="max-height: 75%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#if data.length === 0 && (bookingQuery.filter || bookingQuery.name)}
            No filter results...
        {:else if data.length === 0}
            Loading bookings...
        {:else }
            <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                <thead>
                <tr>
                    <th class="uk-table-shrink">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
                    <th>Name</th>
                    <th class="uk-visible@s uk-table-shrink">People</th>
                    <th class="uk-text-nowrap">
                        <span on:click={() => switchOrderBy('arrival')}>Arrival
                            <a uk-icon={orderStates.arrival === State.none ? "triangle-left" : orderStates.arrival === State.asc ? "triangle-up" : "triangle-down"}
                               class:uk-text-secondary={orderStates.arrival !== State.none} href="{'#'}"> </a></span>
                        {#if orderStates.arrival !== State.none}
                            <a class="uk-link-reset" on:click={() => switchOrderBy(null)} href="{'#'}">✕</a>
                        {/if}
                    </th>
                    <th class="uk-text-nowrap">
                        <span on:click={() => switchOrderBy('departure')}>{$screenWidthS ? 'Depart' : 'Departure'}
                            <a uk-icon={orderStates.departure === State.none ? "triangle-left" : orderStates.departure === State.asc ? "triangle-up" : "triangle-down"}
                               class:uk-text-secondary={orderStates.departure !== State.none} href="{'#'}"> </a></span>
                        {#if orderStates.departure !== State.none}
                            <a class="uk-link-reset" on:click={() => switchOrderBy(null)} href="{'#'}">✕</a>
                        {/if}
                    </th>
                    <th class="uk-visible@m uk-table-shrink">Notes</th>
                    <th class="uk-visible@m">{$screenWidthL ? '' : 'PAF '}Event</th>
                    <th class="uk-visible@l">Group</th>
                    <th class="uk-visible@s uk-table-shrink">Paid</th>
                </tr>
                </thead>
                <tbody>
                {#each data as booking}
                    <tr class="uk-table-link" class:uk-text-muted={booking.cancelled}>
                        <td>{#if booking.cancelled}<span uk-icon="close"></span>{/if}</td>
                        <td on:click={() => openForm(booking)}>{booking.name}</td>
                        <td class="uk-visible@s" on:click={() => openForm(booking)}>{booking.people_count}</td>
                        <td on:click={() => openForm(booking)}>{DateTime.fromSQL(booking.arrival).toFormat('dd LLL yyyy')}</td>
                        <td on:click={() => openForm(booking)}>{DateTime.fromSQL(booking.departure).toFormat('dd LLL yyyy')}</td>
                        <td class="uk-visible@m">{#if booking.info}<span uk-icon="icon: info" uk-tooltip="title: {booking.info}"> </span>{/if}</td>
                        <td on:click={() => openForm(booking)} class="uk-visible@m">
                            {#if booking.paf_events !== null}
                                {#each booking.paf_events as event}
                                    <span class="uk-label" class:uk-label-success={event.confirmed} class:uk-label-warning={!event.confirmed}>{event.abbreviation}</span>&nbsp;
                                {/each}
                            {/if}
                        </td>
                        <td on:click={() => openForm(booking)} class="uk-visible@l"><span class="uk-label uk-background-secondary">{booking.group_name}</span></td>
                        <td class="uk-visible@s">
                            {#if booking.paid}
                                <span class="uk-text-success" uk-icon="check"></span>
                            {:else if !booking.cancelled && DateTime.fromSQL(booking.arrival) < DateTime.now() && DateTime.fromSQL(booking.departure) > DateTime.now()}
                                <a class="uk-text-warning" on:click={() => true} href="{'#'}" uk-icon="close"> </a>
                            {:else if !booking.cancelled && DateTime.fromSQL(booking.arrival) > DateTime.now() }
                                <a class="uk-text-muted" on:click={() => true} href="{'#'}" uk-icon="close"> </a>
                            {:else if !booking.cancelled }
                                <a class="uk-text-danger" on:click={() => true} href="{'#'}" uk-icon="close"> </a>
                            {:else if booking.cancelled}
                                <span class="uk-text-muted" uk-icon="minus"></span>
                            {/if}
                        </td>
                    </tr>
                {/each}
                </tbody>
            </table>
        {/if}
    </div>
    <InfiniteScroll hasMore={newBatch.length} threshold={80} on:loadMore={() => {
        if (bookingQuery.page < maxPage) {
            bookingQuery.page++
            fetchData()
        }
    }} />
</div>

<!-- BOOKING form modal -->

<div id="modal-booking"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>
                {#key recreateForm}
                    <BookingForm bind:booking={selectedBooking} bind:edit={editBooking} on:message={processBooking} />
                {/key}
            </div>
        </div>
    </div>
</div>