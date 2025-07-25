<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {bookingNames, calculateBookingAmounts, getPaymentBookings, updateBooking} from '../stores/booking'
    import InfiniteScroll from 'svelte-infinite-scroll'
    import * as SimpleSwitch from 'a-simple-switch'
    import UIkit from 'uikit'
    import {screenWidthL, screenWidthM, screenWidthS} from '../stores/navigation'
    import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete'
    import {DateTime, Interval} from 'luxon'
    import InvoiceForm from './InvoiceForm.svelte'
    import {sciMembers, updateMember} from '../stores/member'
    import {createInvoice, getInvoiceById, updateInvoice} from '../stores/invoice'
    import PaymentForm from './PaymentForm.svelte'


    let maxPage = 2
    let data = []
    let newBatch = []
    let bookingQuery = {
        filter: {
            arrival: [DateTime.now().minus({years:1}).toSQLDate(), DateTime.now().toSQLDate()],
            paid: false
        },
        page: 1,
        limit: 50,
        orderBy: {
            key: 'departure',
            order: 'ASC'
        }
    }
    let selectedBooking
    let invoice = null
    let sciMember
    let prevYearSciDaysUsed = 0
    // let total = 0
    // let dispatched = false
    let recreateForm = false

    $: data = [...data, ...newBatch]
    // $: total = Number($form.stay_amount) + Number($form.membership_amount) + Number($form.meals_amount)

    const dispatch = createEventDispatcher()

    // const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
    //     initialValues: {
    //         sci_days_used: 0,
    //         stay_amount: 0,
    //         membership_amount: 0,
    //         meals_amount: 0
    //     },
    //     onSubmit: values => {
    //         dispatched = true
    //         // dispatch('message', {
    //         //     goto: 'save'
    //         // })
    //     },
    //     validationSchema: yup.object().shape({
    //         sci_days_used: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
    //         stay_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
    //         membership_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
    //         meals_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string))
    //     })
    // })

    onMount(async () => {

        await fetchData()

        SimpleSwitch.init()

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
        const result = await getPaymentBookings(bookingQuery)
        maxPage = result.meta.last_page
        newBatch = calcBookingAmounts(result.data)
    }

    async function fetchBooking(bookingName) {
        bookingQuery.page = 1
        newBatch = []
        if (bookingName !== undefined && bookingName !== null) {
            bookingQuery.name = bookingName
            const result = await getPaymentBookings(bookingQuery)
            maxPage = result.meta.last_page
            data = [... calcBookingAmounts(result.data)]
        } else {
            delete bookingQuery.name
            data = []
            await fetchData()
        }
    }

    function togglePaid() {
        bookingQuery.filter.paid = !document.getElementById('paid').checked
        bookingQuery.page = 1
        bookingQuery.orderBy = {
            key: bookingQuery.filter.paid ? 'date_paid' : 'departure',
            order: bookingQuery.filter.paid ? 'DESC' : 'ASC'
        }
        data = []
        newBatch = []
        fetchData()
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'payment'
        })
    }

    function calcBookingAmounts(bookings) {
        bookings.forEach(booking => calculateBookingAmounts(booking))
        return bookings
    }

    // async function initPayForm(booking) {
    //     Object.entries($errors).forEach(e => $errors[e[0]] = '')
    //     Object.entries($form).forEach(e => $form[e[0]] = booking[e[0]])
    //     sciMember = booking.sci_member ? $sciMembers.find(m => m.id === booking.member_id) : null
    // }

    // function adjustSciAmount(booking, init) {
    //     if (booking.no_stay_pay && init) {
    //         $form.sci_days_used = 0
    //         $form.stay_amount = 0
    //     } else {
    //         if (sciMember === null)
    //             $form.sci_days_used = 0
    //         else if (DateTime.fromSQL(booking.arrival).year < DateTime.now().year) {
    //             let prevYearDays = Math.round(DateTime.fromSQL(booking.arrival).until(DateTime.fromSQL(booking.departure).year < DateTime.now().year ? DateTime.fromSQL(booking.departure) : DateTime.fromSQL(booking.arrival).endOf('year')).length('days'))
    //             let currYearDays = Math.round(DateTime.fromSQL(booking.departure).year < DateTime.now().year ? 0 : DateTime.now().startOf('year').until(DateTime.fromSQL(booking.departure)).length('days'))
    //             let prevYearSciDaysLeft = $settings.sci_days - sciMember.sci_days_used_prev_year
    //             let currYearSciDaysLeft = $settings.sci_days - sciMember.sci_days_used
    //             prevYearSciDaysUsed = prevYearDays > prevYearSciDaysLeft ? prevYearSciDaysLeft : prevYearDays
    //             let currYearSciDaysUsed = currYearDays > currYearSciDaysLeft ? currYearSciDaysLeft : currYearDays
    //             $form.sci_days_used = prevYearSciDaysUsed + currYearSciDaysUsed
    //         }
    //         else if ($form.sci_days_used > $settings.sci_days - sciMember.sci_days_used)
    //             $form.sci_days_used = $settings.sci_days - sciMember.sci_days_used
    //         if ($form.sci_days_used > booking.stay_days)
    //             $form.sci_days_used = booking.stay_days
    //
    //         $form.stay_amount = (booking.stay_days - $form.sci_days_used) * (booking.stay_days <= $settings.short_stay_duration ? $settings.price_stay_short : booking.stay_days < 30 ? $settings.price_stay : $settings.price_stay_month)
    //
    //         // if booking is for more than one person, add amount for full period for the rest of
    //         $form.stay_amount += $form.people_count === 1 ? 0 : (booking.people_count - 1) * booking.stay_days * (booking.stay_days <= $settings.short_stay_duration ? $settings.price_stay_short : booking.stay_days < 30 ? $settings.price_stay : $settings.price_stay_month)
    //         booking.stay_amount_orig = $form.stay_amount
    //     }
    // }

    async function payDone() {

        let reload = false

        if (selectedBooking.sci_member && sciMember?.id === selectedBooking.member_id && selectedBooking.sci_days_used > 0) {
            if (prevYearSciDaysUsed > 0) {
                sciMember.sci_days_used_prev_year = sciMember.sci_days_used_prev_year + prevYearSciDaysUsed
                sciMember.sci_days_used = sciMember.sci_days_used + selectedBooking.sci_days_used - prevYearSciDaysUsed
            } else
                sciMember.sci_days_used = sciMember.sci_days_used + selectedBooking.sci_days_used
            await updateMember(sciMember)
            sciMember = null
            reload = true
        }

        // if (selectedBooking.total_amount !== total) {
        //     selectedBooking.sci_days_used = $form.sci_days_used
        //     selectedBooking.stay_amount = $form.stay_amount
        //     selectedBooking.membership_amount = $form.membership_amount
        //     selectedBooking.meals_amount = $form.meals_amount
        //     selectedBooking.total_amount = total
        // }
        selectedBooking.date_paid = DateTime.now().toSQLDate()
        selectedBooking.paid = true

        if (await updateBooking(selectedBooking)) {
            UIkit.notification('<span uk-icon="icon: check"></span> ¥€$ thank you!', {status: 'success', pos: 'bottom-center'})
            reload = true
        }
        else
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})

        // UIkit.dropdown('#dropdown-pay-'+booking.id).hide(false)

        if (reload)
            await fetchBooking(null)
    }

    async function openPaymentModal(booking) {
        sciMember = booking.sci_member ? $sciMembers.find(m => m.id === booking.member_id) : null
        selectedBooking = JSON.parse(JSON.stringify(booking))
        recreateForm = !recreateForm
        UIkit.modal("#modal-payment").show()
    }

    async function payInvoice() {
        // selectedBooking = JSON.parse(JSON.stringify(booking))
        // selectedBooking.stay_amount = $form.stay_amount
        // selectedBooking.membership_amount = $form.membership_amount
        // selectedBooking.meals_amount = $form.meals_amount

        let dbInvoice = null
        if (selectedBooking?.invoice_id !== null && selectedBooking?.invoice_id !== 0)
            dbInvoice = await getInvoiceById(selectedBooking.invoice_id)
        invoice = dbInvoice?.invoice_nr ? {invoice_nr: dbInvoice?.invoice_nr} : null

        recreateForm = !recreateForm
        // UIkit.dropdown('#dropdown-pay-'+booking.id).hide(false)
        UIkit.modal("#modal-invoice").show()
    }

    async function processPayment(event) {
        if (event.detail.pay !== undefined) {
            if (event.detail.pay.prevYearSciDaysUsed !== undefined)
                prevYearSciDaysUsed = event.detail.pay.prevYearSciDaysUsed
            switch (event.detail.pay) {
                case 'cancel':
                    UIkit.modal("#modal-payment").hide()
                    break
                case 'squid':
                    await payDone()
                    UIkit.modal("#modal-payment").hide()
                    break
                case 'invoice':
                    UIkit.modal("#modal-payment").hide()
                    payInvoice()
            }
        }
    }

    async function processInvoice(event) {
        if (event.detail.goto !== undefined) {
            switch (event.detail.goto) {
                case 'cancel':
                    UIkit.modal("#modal-invoice").hide()
                    break
                case 'save':
                    const sendMail = event.detail.sendMail ? event.detail.sendMail : false
                    let invoiceSuccess
                    if (selectedBooking.invoice_id && selectedBooking.invoice_id !== 0) {
                        invoice.id = selectedBooking.invoice_id
                        invoiceSuccess = await updateInvoice(invoice, sendMail)
                    } else
                        invoiceSuccess = await createInvoice(invoice)

                    if (invoiceSuccess?.id) {
                        UIkit.modal("#modal-invoice").hide()
                        UIkit.notification('<span uk-icon="icon: check"></span> Invoice created!', {status:'success', pos: 'bottom-center'})
                        await bookingUpdate(invoiceSuccess.id, invoiceSuccess.number, invoice.date_paid !== null)
                    } else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed creating invoice!', {status: 'danger', pos: 'bottom-center'})
                    if (invoiceSuccess?.dropbox)
                        UIkit.notification('<span uk-icon="icon: check"></span> Dropbox upload successful!', {status:'success', pos: 'bottom-center'})
                    if (invoiceSuccess?.email)
                        UIkit.notification('<span uk-icon="icon: check"></span> Email sent!', {status:'success', pos: 'bottom-center'})

                    if (invoiceSuccess?.number !== invoice.invoice_nr)
                        alert('Invoice number has changed to ' + invoiceSuccess.number + '!\nPlease correct in payment sheet if this is an in-house payment!')

                    dispatchReload()
            }
        }
    }

    async function bookingUpdate(invoiceId, invoiceNr, setPaidDate) {

        let reload = false

        if (selectedBooking.sci_member && sciMember?.id === selectedBooking.member_id && selectedBooking.sci_days_used > 0) {
            if (prevYearSciDaysUsed > 0) {
                sciMember.sci_days_used_prev_year = sciMember.sci_days_used_prev_year + prevYearSciDaysUsed
                sciMember.sci_days_used = sciMember.sci_days_used + selectedBooking.sci_days_used - prevYearSciDaysUsed
            } else
                sciMember.sci_days_used = sciMember.sci_days_used + selectedBooking.sci_days_used
            await updateMember(sciMember)
            sciMember = null
            reload = true
        }

        selectedBooking.stay_amount = invoice.stay_amount
        selectedBooking.membership_amount = invoice.membership_amount
        selectedBooking.meals_amount = invoice.meals_amount
        selectedBooking.custom_amount = invoice.custom_amount
        selectedBooking.total_amount = invoice.total_amount
        if (invoiceId !== null)
            selectedBooking.invoice_id = invoiceId
        selectedBooking.invoice_nr = invoiceNr? invoiceNr : invoice.invoice_nr
        selectedBooking.date_paid = setPaidDate ? DateTime.now().toSQLDate() : null
        selectedBooking.paid = true

        if (await updateBooking(selectedBooking)) {
            UIkit.notification('<span uk-icon="icon: check"></span> ¥€$ thank you!', {status: 'success', pos: 'bottom-center'});
            reload = true
        }
        else
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'});

        if (reload)
            await fetchBooking(null)
    }
</script>

<!--<style>-->
<!--    .strikethrough {-->
<!--        text-decoration: line-through;-->
<!--    }-->
<!--</style>-->

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center uk-flex-middle">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' : ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}" id="autocomplete" type="search" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off" maxlength="256">
            <div class="uk-margin-left"><input type="checkbox" id="paid" data-type="simple-switch" on:change={togglePaid} checked /> {bookingQuery.filter.paid ? 'Paid' : 'Unpaid'}</div>
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
                    <th>Name</th>
                    <th>Stay</th>
                    <th class="uk-table-shrink uk-visible@m">People</th>
                    <th class="uk-table-shrink uk-visible@m">Nights</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@l">Rate €</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@l">Stay €</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@l">Member €</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@l">Meals €</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@l">Custom €</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@s">Total €</th>
                    {#if !bookingQuery.filter.paid}
                        <th class="uk-table-shrink uk-text-nowrap">Pay now</th>
                    {:else}
                        <th class="uk-table-shrink uk-visible@l">Invoice</th>
                        <th>Paid</th>
                    {/if}
                </tr>
                </thead>
                <tbody>
                {#each data as booking}
                    <tr>
                        <td>{booking.name}</td>
                        <td>{DateTime.fromSQL(booking.arrival).toFormat('dd LLL yyyy') + ' - ' + DateTime.fromSQL(booking.departure).toFormat('dd LLL yyyy')}</td>
                        <td class="uk-visible@m">{booking.people_count}</td>
                        <td class="uk-visible@m">{booking.stay_days}</td>
                        <td class="uk-visible@l">{booking.stay_rate}</td>
                        <td class="uk-visible@l" class:uk-text-warning={booking.stay_amount !== booking.stay_amount_orig}>
                            {#if booking.stay_amount !== booking.stay_amount_orig}<span uk-tooltip={booking.stay_amount_orig}>{booking.stay_amount}</span>
                            {:else} {booking.stay_amount}
                            {/if}
                        </td>
                        <td class="uk-visible@l" class:uk-text-warning={booking.membership_amount !== booking.membership_amount_orig}>
                            {#if booking.membership_amount !== booking.membership_amount_orig}<span uk-tooltip={booking.membership_amount_orig}>{booking.membership_amount}</span>
                            {:else} {booking.membership_amount}
                            {/if}
                        </td>
                        <td class="uk-visible@l" class:uk-text-warning={booking.meals_amount !== booking.meals_amount_orig}>
                            {#if booking.meals_amount !== booking.meals_amount_orig}<span uk-tooltip={booking.meals_amount_orig}>{booking.meals_amount}</span>
                            {:else} {booking.meals_amount}
                            {/if}
                        </td>
                        <td class="uk-visible@s">{booking.custom_amount}</td>
                        <td class="uk-visible@s">{booking.total_amount}</td>
                        {#if !bookingQuery.filter.paid}
                            <td class="uk-text-nowrap">
                                {#if booking.mattress_booking}
                                    <button class="uk-button uk-button-small uk-button-default" disabled>Mattress</button>
                                {:else}
                                    <button on:click={() => openPaymentModal(booking)} class="uk-button uk-button-small uk-button-default" class:uk-button-danger={DateTime.fromSQL(booking.departure) < DateTime.now()}>Pay</button>
                                {/if}
<!--                                <button on:click={() => initPayForm(booking)} class="uk-button uk-button-small uk-button-default" class:uk-button-danger={DateTime.fromSQL(booking.departure) < DateTime.now()}>Pay</button>-->
<!--                                <div uk-dropdown="mode: click; pos: left-center" id="dropdown-pay-{booking.id}">-->
<!--                                    <ul class="uk-nav uk-dropdown-nav">-->
<!--                                        {#if booking?.sci_member}-->
<!--                                            <li>-->
<!--                                                <div class="uk-margin-small-bottom uk-grid-small uk-flex uk-flex-middle" uk-grid>-->
<!--                                                    <div class="uk-width-1-2"><span class:strikethrough={booking.no_stay_pay && Number($form.sci_days_used) === 0}>Use SCI days</span>-->
<!--                                                        <input class="uk-input uk-margin-small-left uk-form-width-xsmall" id="form-sci_days_used" name="sci_days_used" type="text"-->
<!--                                                               class:uk-form-danger={$errors.sci_days_used && $touched.sci_days_used} style="color: black"-->
<!--                                                               on:keyup={() => {handleChange && adjustSciAmount(booking, false)}} on:blur={handleChange} bind:value={$form.sci_days_used}>-->
<!--                                                    </div>-->
<!--                                                    <div class="uk-width-1-2 uk-text-right">({$settings.sci_days - sciMember?.sci_days_used} left)</div>-->
<!--                                                </div>-->
<!--                                            </li>-->
<!--                                        {/if}-->
<!--                                        <li>-->
<!--                                            <div class="uk-margin-small-bottom uk-grid-small uk-flex uk-flex-middle" uk-grid>-->
<!--                                                <div class="uk-width-1-2" class:strikethrough={booking.no_stay_pay && Number($form.stay_amount) === 0}>Stay ({booking?.stay_days} nights)</div>-->
<!--                                                <div class="uk-width-1-2 uk-text-right">-->
<!--                                                    <input class="uk-input uk-form-width-small" id="form-stay_amount" name="stay_amount" type="text"-->
<!--                                                           class:uk-form-danger={$errors.stay_amount && $touched.stay_amount} style="color: black; text-align: right"-->
<!--                                                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.stay_amount}>-->
<!--                                                </div>-->
<!--                                            </div>-->
<!--                                        </li>-->
<!--                                        {#if booking?.membership_count > 0}-->
<!--                                            <li>-->
<!--                                                <div class="uk-margin-small-bottom uk-grid-small uk-flex uk-flex-middle" uk-grid>-->
<!--                                                    <div class="uk-width-1-2">{booking?.membership_count > 1 ? ' Memberships ('+booking?.membership_count+')' : 'Membership'}</div>-->
<!--                                                    <div class="uk-width-1-2 uk-text-right">-->
<!--                                                        <input class="uk-input uk-form-width-small" id="form-stay_membership-no1pw-search" name="membership_amount" type="text" autocomplete="off"-->
<!--                                                               class:uk-form-danger={$errors.membership_amount && $touched.membership_amount} style="color: black; text-align: right"-->
<!--                                                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.membership_amount}>-->
<!--                                                    </div>-->
<!--                                                </div>-->
<!--                                            </li>-->
<!--                                        {/if}-->
<!--                                        {#if booking.meals_days > 0}-->
<!--                                            <li>-->
<!--                                                <div class="uk-margin-small-bottom uk-grid-small uk-flex uk-flex-middle" uk-grid>-->
<!--                                                    <div class="uk-width-1-2" class:strikethrough={booking.no_meal_pay && Number($form.meals_amount) === 0}>Meals ({booking.meals_days} days)</div>-->
<!--                                                    <div class="uk-width-1-2 uk-text-right">-->
<!--                                                        <input class="uk-input uk-form-width-small" id="form-meals_amount" name="meals_amount" type="text"-->
<!--                                                               class:uk-form-danger={$errors.meals_amount && $touched.meals_amount} style="color: black; text-align: right"-->
<!--                                                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.meals_amount}>-->
<!--                                                    </div>-->
<!--                                                </div>-->
<!--                                            </li>-->
<!--                                        {/if}-->
<!--                                        <li>-->
<!--                                            <div class="uk-grid-small uk-flex uk-flex-bottom uk-margin-medium-top" uk-grid>-->
<!--                                                <div class="uk-width-1-2 uk-text-bold uk-text-emphasis">TOTAL</div>-->
<!--                                                <div class="uk-width-1-2 uk-text-right uk-text-bold uk-text-emphasis">{total}</div>-->
<!--                                            </div>-->
<!--                                        </li>-->
<!--                                        <li>-->
<!--                                            <div class="uk-flex uk-flex-center uk-margin-medium-top">-->
<!--                                                <button class="uk-button uk-button-primary" type="button" on:click={() => payDone(booking)}-->
<!--                                                        disabled={!$isValid } class:uk-button-primary={$isValid}>Squid</button>-->
<!--                                                <button class="uk-button uk-margin-medium-left" id="submit" type="submit"-->
<!--                                                        disabled={!$isValid } class:uk-button-primary={$isValid} on:click={() => payInvoice(booking)}>Invoice</button>-->
<!--                                            </div>-->
<!--                                        </li>-->
<!--                                    </ul>-->
<!--                                </div>-->
                            </td>
                        {:else}
                            <td class="uk-text-nowrap uk-visible@l">{booking.invoice_nr}</td>
                            <td class="uk-table-shrink uk-text-nowrap">{booking.date_paid !== null ? DateTime.fromSQL(booking.date_paid).toFormat('dd LLL yyyy') : ''}</td>
                        {/if}
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

<!-- PAYMENT form modal -->

<div id="modal-payment"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateForm}
                    <PaymentForm bind:booking={selectedBooking} bind:sciMember={sciMember} on:message={processPayment} />
                {/key}
            </div>
        </div>
    </div>
</div>

<!-- INVOICE form modal -->

<div id="modal-invoice"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateForm}
                    <InvoiceForm bind:booking={selectedBooking} bind:invoice={invoice} on:message={processInvoice} />
                {/key}
            </div>
        </div>
    </div>
</div>