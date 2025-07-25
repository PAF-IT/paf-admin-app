<script>
    import {DateTime, Interval} from 'luxon'
    import {createEventDispatcher, onMount} from 'svelte'
    import { createForm } from 'svelte-forms-lib'
    import * as yup from 'yup'
    import flatpickr from 'flatpickr'
    import {screenWidthL, screenWidthS} from '../stores/navigation'
    import {getMemberByName, memberNames} from '../stores/member'
    import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete'
    import {events} from '../stores/event'
    import {settings} from '../stores/api'


    export let booking = undefined
    export let edit = false

    let pafEvents = []
    let dispatched = false
    let pafEventsReload = false
    let pafEventsSelectReload = false
    let stayDays = 0

    $: $form.departure && filterEvents()
    $: $form.departure && updateStayRate()

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            name: '',
            member_id: 0,
            sci_member: false,
            sci_days_used: 0,
            membership_needed: true,
            membership_count: 1,
            email: '',
            city: '',
            arrival: '',
            departure: '',
            people_count: 1,
            info: '',
            cancelled: false,
            show_on_website: true,
            paid: false,
            date_paid: '',
            invoice_id: 0,
            invoice_nr: '',
            institutional: false,
            no_stay_pay: true,
            no_meal_pay: false,
            longstayer: false,
            group_name: '',
            paf_event_select: 0,
            stay_rate: 0,
            stay_amount: 0,
            membership_amount: 0,
            meals_amount: 0,
            total_amount: 0,
            early_pay: false
        },
        onSubmit: values => {
            dispatched = true
            updateBooking(values)
            dispatch('message', {
                goto: 'save'
            })
        },
        validationSchema: yup.object().shape({
            name: yup.string().min(4).required(),
            email: yup
                .string()
                .email()
                .required(),
            city: yup.string().optional(),
            arrival: yup.date().required(),
            departure: yup.date().required(),
            membership_count: yup.number().required(),
            membership_needed: yup.bool().required(),
            people_count: yup.number().min(1).required(),
            info: yup.string().optional(),
            cancelled: yup.bool().required(),
            show_on_website: yup.bool().required(),
            paid: yup.bool().required(),
            invoice_nr: yup.string().optional(),
            institutional: yup.bool().required(),
            no_stay_pay: yup.bool().required(),
            no_meal_pay: yup.bool().required(),
            longstayer: yup.bool().required(),
            group_name: yup.string().optional(),
            paf_event_select: yup.number().optional(),
            sci_days_used: yup.number().min(0).transform((number, string) => string === '' ? 0 : Number(string)),
            stay_rate: yup.number().min(0).transform((number, string) => string === '' ? 0 : Number(string)),
            stay_amount: yup.number().min(0).transform((number, string) => string === '' ? 0 : Number(string)),
            membership_amount: yup.number().min(0).transform((number, string) => string === '' ? 0 : Number(string)),
            meals_amount: yup.number().min(0).transform((number, string) => string === '' ? 0 : Number(string)),
            total_amount: yup.number(),
            early_pay: yup.bool().required(),
        })
    })

    onMount(async () => {

        pafEvents = JSON.parse(JSON.stringify($events))

        if (booking !== undefined) {
            $form.name = booking !== null && booking.name !== null ? booking.name : ''
            $form.member_id = booking !== null && booking.member_id !== null ? booking.member_id : 0
            $form.sci_member = booking !== null && booking.sci_member !== null ? booking.sci_member : false
            $form.sci_days_used = booking !== null && booking.sci_days_used !== null ? booking.sci_days_used : 0
            $form.membership_count = booking !== null && booking.membership_count !== null ? booking.membership_count : 1
            $form.membership_needed = booking !== null && booking.membership_count !== null ? (booking.membership_count > 0) : true
            $form.email = booking !== null && booking.email !== null ? booking.email : ''
            $form.city = booking !== null && booking.city !== null ? booking.city : ''
            $form.arrival = booking !== null && booking.arrival !== null ? booking.arrival : ''
            $form.departure = booking !== null && booking.departure !== null ? booking.departure : ''
            $form.people_count = booking !== null && booking.people_count !== null ? booking.people_count : 1
            $form.info = booking !== null && booking.info !== null ? booking.info : ''
            $form.cancelled = booking !== null && booking.cancelled !== null ? booking.cancelled : false
            $form.show_on_website = booking !== null && booking.show_on_website !== null ? booking.show_on_website : true
            $form.paid = booking !== null && booking.paid !== null ? booking.paid : false
            $form.date_paid = booking !== null && booking.date_paid !== null ? booking.date_paid : ''
            $form.invoice_id = booking !== null && booking.invoice_id !== null ? booking.invoice_id : 0
            $form.invoice_nr = booking !== null && booking.invoice_nr !== null ? booking.invoice_nr : ''
            $form.institutional = booking !== null && booking.institutional !== null ? booking.institutional : false
            $form.no_stay_pay = booking !== null && booking.no_stay_pay !== null ? booking.no_stay_pay : false
            $form.no_meal_pay = booking !== null && booking.no_meal_pay !== null ? booking.no_meal_pay : false
            $form.longstayer = booking !== null && booking.longstayer !== null ? booking.longstayer : false
            $form.group_name = booking !== null && booking.group_name !== null ? booking.group_name : ''
            $form.paf_events = booking !== null && booking.paf_events !== null ? booking.paf_events : []
            pafEvents.forEach(e => e.selected = $form.paf_events.find(dbEvent => dbEvent.id === e.id) !== undefined)
            $form.paf_event_select = 0
            $form.stay_rate = booking !== null && booking.stay_rate !== null ? booking.stay_rate : 0
            $form.stay_amount = booking !== null && booking.stay_amount !== null ? booking.stay_amount : 0
            $form.membership_amount = booking !== null && booking.membership_amount !== null ? booking.membership_amount : 0
            $form.meals_amount = booking !== null && booking.meals_amount !== null ? booking.meals_amount : 0
            $form.total_amount = booking !== null && booking.total_amount !== null ? booking.total_amount : 0
            $form.early_pay = booking !== null && booking.early_pay !== null ? booking.early_pay : false

            stayDays = Interval.fromDateTimes(DateTime.fromSQL($form.arrival), DateTime.fromSQL($form.departure)).length('days')
            if ($form.stay_rate === 0)
                updateStayRate()

            // ugly hack to get force evaluate isValid
            if (booking === null)
                handleSubmit(null)
        }

        if (booking !== undefined && booking === null) {
            const autoCompleteJS = new autoComplete({
                selector: "#form-name",
                placeHolder: "Search for member... (or enter new name)",
                diacritics: true,
                searchEngine: 'strict',
                data: {
                    src: $memberNames,
                    cache: true,
                },
                resultsList: {
                    element: (list, data) => {
                        if (!data.results.length) {
                            const message = document.createElement("div")
                            message.setAttribute("class", "no_result")
                            message.innerHTML = `<span>No Member for "${data.query}"</span>`
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
                            fillMemberData(event.detail.selection.value)
                        },
                        keyup: () => {
                            if (autoCompleteJS.input.value === '')
                                fillMemberData(null)
                        }
                    }
                }
            })
        }

        flatpickr('#form-dates', {
            monthSelectorType: 'static',
            mode: 'range',
            defaultDate: [$form.arrival, $form.departure],
            onChange(selectedDates, dateStr) {
                $form.arrival = dateStr.substring(0, 10)
                $form.departure = dateStr.substring(14)
                if ($form.arrival !== '')
                    document.getElementById('form-arrival').focus()
                if ($form.departure !== '') {
                    document.getElementById('form-departure').focus()
                    setTimeout(() => document.getElementById('form-departure').blur(), 0)
                } else
                    $errors.departure = 'Departure date needed!'
            }
        })
    })

    async function fillMemberData(name) {
        let memberData = null
        if (name !== null) {
            memberData = await getMemberByName(name)
            if (memberData !== undefined && memberData !== null)
                memberData = memberData[0]
        }
        $form.name = memberData !== null && memberData.name !== null ? memberData.name : ''
        $form.member_id = memberData !== null && memberData.id !== null ? memberData.id : 0
        $form.sci_member = Boolean(memberData !== null && memberData.sci_member !== null && memberData.sci_member)
        $form.sci_days_used = memberData !== null && memberData.sci_days_used !== null ? memberData.sci_days_used : 0
        $form.membership_needed = memberData !== null && memberData.renew_date !== null ? DateTime.fromSQL(memberData.renew_date) < DateTime.now() : true
        $form.email = memberData !== null && memberData.email !== null ? memberData.email : ''
        $form.city = memberData !== null && memberData.city !== null ? memberData.city : ''
        $form.people_count = 1
        document.getElementById('form-email-no1pw-search').focus()
        setTimeout(() => document.getElementById('form-email-no1pw-search').blur(), 0)
    }

    function updateBooking(values) {
        if (booking === null)
            booking = {}
        Object.entries(values).forEach(e => booking[e[0]] = e[1])
        if (booking.paid && booking.date_paid === '')
            booking.date_paid = DateTime.now().toSQLDate()

        booking.membership_count = booking.membership_needed ? booking.people_count : 0
        booking.paf_events = updateEventConfirmation()
        booking.stay_days = Interval.fromDateTimes(DateTime.fromSQL(booking.arrival), DateTime.fromSQL(booking.departure)).length('days')
    }

    function updateEventConfirmation() {
        let events = pafEvents.filter(e => e.selected && e.show)
        if (events.length > 0) {
            events = events.map(e => {
                const existingBookingIndex = e.bookings !== null && booking !== null ? e.bookings.findIndex(b => b.id === booking.id) : -1
                const existingBookingCount = existingBookingIndex > -1 ? e.bookings[existingBookingIndex].count : 0
                const existingBookingConfirmed = existingBookingIndex > -1 && e.bookings[existingBookingIndex].confirmed
                return {
                    id: e.id,
                    name: e.name,
                    abbreviation: e.abbreviation,
                    confirmed: existingBookingConfirmed || e.max_participants === null || ((e.bookings === null || e.bookings.length === 0) && Number($form.people_count) <= e.max_participants)
                        || (e.bookings !== null && e.bookings.reduce((pVal, cVal) => pVal + cVal['count'], 0) + Number($form.people_count) - existingBookingCount <= e.max_participants)
                }
            })
        }
        return events
    }

    function updateStayRate() {
        let updatedStayDays = Interval.fromDateTimes(DateTime.fromSQL($form.arrival), DateTime.fromSQL($form.departure)).length('days')
        if (stayDays !== updatedStayDays && $form.arrival !== '' && $form.departure !== '') {
            stayDays = Interval.fromDateTimes(DateTime.fromSQL($form.arrival), DateTime.fromSQL($form.departure)).length('days')
            $form.stay_rate = stayDays <= $settings.short_stay_duration ? $settings.price_stay_short : stayDays >= 30 ? $settings.price_stay_month : $settings.price_stay
        }
    }

    async function deleteMe() {
        if (booking !== null && booking.id !== null && confirm("Are you sure to delete this booking?")) {
            dispatch('message', {
                goto: 'delete'
            })
        }
    }

    function cancel() {
        dispatch('message', {
            goto: 'cancel'
        })
    }

    function filterEvents() {
        if ($form.arrival !== '' && $form.departure !== '') {
            pafEvents.forEach(e => e.show = Interval.fromDateTimes(DateTime.fromSQL(e.start_date), DateTime.fromSQL(e.end_date))
                .overlaps(Interval.fromDateTimes(DateTime.fromSQL($form.arrival), DateTime.fromSQL($form.departure))))
            pafEventsSelectReload = !pafEventsSelectReload
        }
    }

    function selection(event) {
        handleChange(event)
        eventSelection(Number($form.paf_event_select), true)
    }

    function eventSelection(id, select) {
        if (id > 0) {
            pafEvents.find(e => e.id === id).selected = select
            $form.paf_events = updateEventConfirmation()
            setTimeout(() => {
                pafEventsReload = !pafEventsReload
                pafEventsSelectReload = !pafEventsSelectReload
            }, 0)
        }
    }
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">
    {#if !edit && !dispatched}
        New booking
    {:else if !dispatched}
        Edit { $screenWidthS ? '' : 'booking'}
        {#if $form.cancelled}
            <button class="uk-button uk-text-normal uk-margin uk-button-secondary uk-position-bottom-right uk-button-danger" type="button" on:click={deleteMe}>Delete</button>
        {/if}
    {:else if edit}
        Updating booking
    {:else }
        Creating booking
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <form id="bookingForm" class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-personals">Personals</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-personals" uk-grid>
                <div class="uk-width-1-1 uk-inline">
                    <input class="uk-input" id="form-name" name="name" type="text" placeholder="Name"
                           class:uk-form-danger={$errors.name && $touched.name} style="color: black"
                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.name}>
                    {#if $form.sci_member || (booking !== undefined && booking !== null && booking.sci_member)}
                        <span class="uk-label uk-label-warning uk-position-center-right uk-margin-small-right">SCI{$screenWidthS ? '' : ' member'}</span>
                    {/if}
                </div>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-email-no1pw-search" name="email" type="email" placeholder="Email" autocomplete="'off"
                           class:uk-form-danger={$errors.email && $touched.email} style="color: black"
                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.email}>
                </div>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-city" name="city" type="text" placeholder="City"
                           class:uk-form-danger={$errors.city && $touched.city} style="color: black"
                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.city}>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-dates">Dates</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-dates" uk-grid>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-arrival" name="arrival" type="text" placeholder="Arrival" readonly
                           class:uk-form-danger={$errors.arrival && $touched.arrival} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.arrival}>
                </div>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-departure" name="departure" type="text" placeholder="Departure" readonly
                           class:uk-form-danger={$errors.departure && $touched.departure} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.departure}>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-accounting">Accounting</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-accounting" uk-grid>
                <div class="uk-width-1-2@s uk-text-nowrap">
                    <input class="uk-input uk-margin-small-right uk-form-width-small" name="people_count" type="number"
                           class:uk-form-danger={$errors.people_count && $touched.people_count} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.people_count}> People count
                </div>
                <div class="uk-width-1-2@s uk-text-nowrap"></div>
                <div class="uk-width-1-2@s uk-text-nowrap">
                    <input class="uk-input uk-margin-small-right uk-form-width-small" name="stay_rate" type="number"
                           class:uk-form-danger={$errors.stay_rate && $touched.stay_rate} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.stay_rate}> Stay rate
                </div>
                <div class="uk-width-1-2@s uk-text-nowrap">
                    <input class="uk-checkbox" id="form-institutional" name="institutional" type="checkbox"
                           on:change={handleChange} on:blur={handleChange} bind:checked={$form.institutional}>&nbsp; Institutional rate
                    &nbsp<span uk-icon="icon: info" uk-tooltip="title: Applies to groups with whom a higher price has been negotiated."> </span>
                </div>
                <div class="uk-width-1-2@s">
                    <div>
                        <input class="uk-checkbox uk-margin-small-right" name="early_pay" type="checkbox"
                               on:change={handleChange} on:blur={handleChange} bind:checked={$form.early_pay}>
                        Pays early (before stay)
                    </div>
                    {#if booking !== null}
                        <div>
                            {#if booking?.paid}
                                <input class="uk-checkbox uk-margin-small-right" id="form-paid" name="paid" type="checkbox"
                                       on:change={handleChange} on:blur={handleChange} bind:checked={$form.paid}> Paid
                            {:else}
                                <input class="uk-checkbox uk-margin-small-right" type="checkbox" disabled
                                       on:change={handleChange} on:blur={handleChange} bind:checked={$form.paid}> Paid
                            {/if}
                        </div>
                        <div>
                            <input class="uk-checkbox uk-margin-small-right" name="cancelled" type="checkbox"
                                   on:change={handleChange} on:blur={handleChange} bind:checked={$form.cancelled}> Cancelled
                        </div>
                    {/if}
                    <div>
                        <input class="uk-checkbox uk-margin-small-right" name="membership_needed" type="checkbox"
                               on:change={handleChange} on:blur={handleChange} bind:checked={$form.membership_needed}> Membership/s needed
                    </div>
                </div>
                <div class="uk-width-1-2@s">
                    <div>
                        <input class="uk-checkbox uk-margin-small-right" id="form-longstayer" name="longstayer" type="checkbox"
                               on:change={handleChange} on:blur={handleChange} bind:checked={$form.longstayer}> Longstayer
                    </div>
                    <div>
                        <input class="uk-checkbox uk-margin-small-right" id="form-no_stay_pay" name="no_stay_pay" type="checkbox"
                               on:change={handleChange} on:blur={handleChange} bind:checked={$form.no_stay_pay}> Doesn't pay for stay
                    </div>
                    <div>
                        <input class="uk-checkbox uk-margin-small-right" id="form-no_meal_pay" name="no_meal_pay" type="checkbox"
                               on:change={handleChange} on:blur={handleChange} bind:checked={$form.no_meal_pay}> Doesn't pay for meals
                    </div>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-info">Notes</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-info" uk-grid>
                <div class="uk-width-1-1">
                <textarea class="uk-textarea" name="info"
                          class:uk-form-danger={$errors.info && $touched.info} style="color: black"
                          on:keyup={handleChange} on:blur={handleChange} bind:value={$form.info}></textarea>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-paf_event_ids">PAF Event</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-paf_event_ids" uk-grid>
                {#key pafEventsReload}
                    <div class="uk-width-1-2@s uk-flex uk-flex-middle" uk-margin>
                        {#if !pafEvents.find(e => e.selected)}
                            <span class="uk-text-muted">Add events from dropdown</span>
                        {:else}
                            {#each pafEvents as event}
                                {#if event.selected}
                                    <span class="uk-label uk-label-success" class:uk-label-danger={$form.paf_events.find(dbEvent => dbEvent.id === event.id) !== undefined
                                        && !$form.paf_events.find(dbEvent => dbEvent.id === event.id).confirmed}>
                                        {event.abbreviation}&nbsp;&nbsp;&nbsp;<a class="uk-link-reset" on:click={() => eventSelection(event.id, false)} href="{'#'}">X</a></span>&nbsp;
                                {/if}
                            {/each}
                        {/if}
                    </div>
                {/key}
                <div class="uk-width-1-2@s">
                    {#key pafEventsSelectReload}
                        <select class="uk-select"  id="form-paf_event_select" name="paf_event_select" type="text" on:change={selection}>
                            <option value="0" selected>Select event/s</option>
                            {#each pafEvents as event}
                                {#if event.show && !event.selected}
                                    {#if event.max_participants !== null && event.participant_count >= event.max_participants}
                                        <option value={event.id}>{event.name} (WAITING LIST)</option>
                                    {:else}
                                        <option value={event.id}>{event.name}</option>
                                    {/if}
                                {/if}
                            {/each}
                        </select>
                    {/key}
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-group_name">Group</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-group_name" uk-grid>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" name="group_name" type="text" placeholder="Group name"
                           class:uk-form-danger={$errors.group_name && $touched.group_name} style="color: black"
                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.group_name}>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-website">Website</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-website" uk-grid>
                <div class="uk-width-1-1">
                    <input class="uk-checkbox" id="form-show_on_website" name="show_on_website" type="checkbox"
                           on:change={handleChange} on:blur={handleChange} bind:checked={$form.show_on_website}> Show on website
                </div>
            </div>
        </div>

        <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
            <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
            <button class="uk-button uk-margin-large-left" id="submitBooking" type="submit"
                    disabled={!$isValid} class:uk-button-primary={$isValid}>Save</button>
        </div>
    </form>
{/if}