<script>
    import {DateTime} from 'luxon'
    import {createEventDispatcher, onMount} from 'svelte'
    import { createForm } from 'svelte-forms-lib'
    import * as yup from 'yup'
    import flatpickr from 'flatpickr'
    import {invoiceNumbers} from '../stores/invoice'
    import {screenWidthL} from '../stores/navigation'
    import {countryArray, getMemberById} from '../stores/member'
    import {role, settings} from '../stores/api'


    export let invoice = undefined
    export let booking = undefined
    export let edit = false

    let total = 0
    let hasPaymentType = false
    let needDates = false
    let okInvoiceNr = true
    let invoiceWarning = false
    let okCustom = true
    let stayDisplayLabelString = $settings.text_stay
    let dispatched = false
    let datePicker

    $: needDates = $form.stay_amount > 0 ?  $form.stay_start === '' || $form.stay_end === '' : $form.stay_start !== '' && $form.stay_end === ''
    $: $form.invoice_nr = invoice?.invoice_nr ? invoice?.invoice_nr : getInvoiceNumber()
    $: okInvoiceNr = (invoice?.invoice_nr !== null && invoice?.invoice_nr.substring(0, 6) === $form.invoice_nr.substring(0, 6)) || !$invoiceNumbers.includes($form.invoice_nr.substring(0, 6))
    $: okCustom = !($form.custom_amount !== '' && Number($form.custom_amount > 0) && $form.custom_label === '')
    $: invoiceWarning = /* Number($form.invoice_nr.substring(0, 6)) !== $settings.invoice_nr && */ $form.invoice_nr !== getInvoiceNumber() && (invoice?.invoice_nr !== null && invoice?.invoice_nr !== $form.invoice_nr) && !$invoiceNumbers.includes($form.invoice_nr.substring(0, 6))

    function logForm() {
        console.log('$: $form.invoice_nr: invoice?.invoice_nr=' + invoice?.invoice_nr + ', getInvoiceNumber=' + getInvoiceNumber())
        return true
    }

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            id: null,
            invoice_nr: '',
            name: '',
            email: '',
            address: '',
            zip: '',
            city: '',
            country: '',
            date: DateTime.now().toSQLDate(),
            stay_start: '',
            stay_end: '',
            stay_amount: 0,
            membership_amount: 0,
            meals_amount: 0,
            custom_label: '',
            custom_amount: 0,
            payment_type: ''
        },
        onSubmit: values => {
            if ((!edit && !dispatched && confirm('Please be reminded that an email with the PDF of this invoice will be sent to the provided address.'))
                || (edit && !dispatched)) {

                let sendMail = true
                if (edit)
                    sendMail = confirm('An email will be sent again to this person with a new PDF of the edited invoice.\nCancel to save invoice without emailing.')
                dispatched = true
                if (invoice === null)
                    invoice = {}
                Object.entries(values).forEach(e => invoice[e[0]] = e[1])
                invoice.stay_amount = invoice.stay_amount === '' ? 0 : Number(invoice.stay_amount)
                invoice.meals_amount = invoice.meals_amount === '' ? 0 : Number(invoice.meals_amount)
                invoice.membership_amount = invoice.membership_amount === '' ? 0 : Number(invoice.membership_amount)
                invoice.custom_amount = invoice.custom_amount === '' ? 0 : Number(invoice.custom_amount)
                invoice.total_amount = invoice.stay_amount + invoice.meals_amount + invoice.membership_amount + invoice.custom_amount

                if ($form.payment_type === 'cash')
                    invoice.date_paid = DateTime.now().toSQLDate()
                else
                    invoice.date_paid = null

                dispatch('message', {
                    goto: 'save',
                    sendMail: sendMail
                })
            }
        },
        validationSchema: yup.object().shape({
            id: yup.mixed(),
            invoice_nr: yup.number().moreThan(DateTime.now().minus({years:1}).toFormat('yy')*10000).lessThan((DateTime.now().plus({years:2}).toFormat('yy')*10000-1)).transform((number, string) => {
                if (!(string.length > 6 && String(string).substring(6) === 'CB') && string.length !== 6)
                    return 0
                else
                    return Number(String(string).substring(0, 6))
            }).required(),
            name: yup.string().min(4).max(128).required(),
            email: yup.string().max(128).email().required(),
            address: yup.string().min(4).max(256).required(),
            zip: yup.string().min(4).max(16).required(),
            city: yup.string().min(2).max(32).required(),
            country: yup.string().min(4).max(32).required(),
            date: yup.date().min(DateTime.now().minus({years:2}).toJSDate()).max(DateTime.now().plus({years:1}).toJSDate()).transform((date, string) => DateTime.fromSQL(string).toJSDate()).required(),
            stay_start: yup.mixed(),
            stay_end: yup.mixed(),
            stay_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            membership_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            meals_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            custom_label: yup.string().max(512).test(
                'has-custom-amount',
                'custom_amount > 0 requires custom_label',
                (value, context) => value.length > 0 || Number($form.custom_amount) === 0,
            ),
            custom_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)).test(
                'has-custom-label',
                'custom_label requires custom_amount > 0',
                (value, context) => value > 0 || $form.custom_label.length === 0,
            ),
            payment_type: yup.string().min(4)
        })
    })

    onMount(async () => {

        if (invoice !== undefined && (booking === undefined || booking === null)) {
            $form.id = invoice !== null && invoice.id !== null ? invoice.id : null
            $form.name = invoice !== null && invoice.name !== null ? invoice.name : ''
            $form.email = invoice !== null && invoice.email !== null ? invoice.email : ''
            $form.address = invoice !== null && invoice.address !== null ? invoice.address : ''
            $form.zip = invoice !== null && invoice.zip !== null ? invoice.zip : ''
            $form.city = invoice !== null && invoice.city !== null ? invoice.city : ''
            $form.country = invoice !== null && invoice.country !== null ? invoice.country : ''
            $form.date = invoice !== null && invoice.date !== null ? invoice.date : DateTime.now().toSQLDate()
            $form.stay_start = invoice !== null && invoice.stay_start !== null ? invoice.stay_start : ''
            $form.stay_end = invoice !== null && invoice.stay_end !== null ? invoice.stay_end : ''
            $form.stay_amount = invoice !== null && invoice.stay_amount !== null ? invoice.stay_amount : 0
            $form.membership_amount = invoice !== null && invoice.membership_amount !== null ? invoice.membership_amount : 0
            $form.meals_amount = invoice !== null && invoice.meals_amount !== null ? invoice.meals_amount : 0
            $form.custom_label = invoice !== null && invoice.custom_label !== null ? invoice.custom_label : ''
            $form.custom_amount = invoice !== null && invoice.custom_amount !== null ? invoice.custom_amount : 0
            $form.payment_type = invoice !== null && invoice.payment_type !== null ? invoice.payment_type : ''
            $form.invoice_nr = invoice !== null && invoice.invoice_nr !== null ? invoice.invoice_nr : getInvoiceNumber()

            // ugly hack to get force evaluate isValid
            if (invoice === null)
                handleSubmit(null)

            computeDateStuff()
        }

        if (booking !== undefined && (invoice === undefined || invoice === null || Object.keys(invoice).length <= 2)) {

            let member = null
            if (booking !== null && booking.member_id !== null && booking.member_id > 0)
                member = await getMemberById(booking.member_id)

            $form.id = booking !== null && booking.invoice_id !== null ? booking.invoice_id : null
            $form.name = booking !== null && booking.name !== null ? booking.name : ''
            $form.email = member !== null && member.email !== null ? member.email : booking !== null && booking.email !== null ? booking.email : ''
            $form.address = member !== null && member.address !== null ? member.address : ''
            $form.zip = member !== null && member.zip !== null ? member.zip : ''
            $form.city = member !== null && member.city !== null ? member.city : booking !== null && booking.city !== null ? booking.city : ''
            $form.country = member !== null && member.country !== null ? member.country : ''
            $form.date = DateTime.now().toSQLDate()
            $form.stay_start = booking !== null && booking.arrival !== null ? booking.arrival : ''
            $form.stay_end = booking !== null && booking.departure !== null ? booking.departure : ''
            $form.stay_amount = booking !== null && booking.stay_amount !== null ? booking.stay_amount : 0
            $form.membership_amount = booking !== null && booking.membership_amount !== null ? booking.membership_amount : 0
            $form.meals_amount = booking !== null && booking.meals_amount !== null ? booking.meals_amount : 0
            $form.custom_label = ''
            $form.custom_amount = 0
            $form.payment_type = ''
            $form.invoice_nr = invoice?.invoice_nr ? invoice?.invoice_nr : getInvoiceNumber()

            // ugly hack to get force evaluate isValid
            if (booking === null)
                handleSubmit(null)

            computeDateStuff()
        }

        hasPaymentType = $form.payment_type !== ''
    })

    function getInvoiceNumber() {
        return ($settings.deleted_invoice_nrs?.length > 0 ? $settings.deleted_invoice_nrs[0].substring(0, 6) : $settings.invoice_nr) + ($form.payment_type === 'transfer' ? '' : 'CB')
    }

    function forceValidate() {
        handleChange
        setTimeout(() => Object.keys($touched).forEach(key => $touched[key] = true), 100)
    }

    // For some weird reason flatpickr won't attach in onMount() as everywhere else. That's why here 'manually'...
    function attachDatePicker(range) {
        if (range)
            datePicker = flatpickr('#form-dates', {
                monthSelectorType: 'static',
                mode: 'range',
                defaultDate: [$form.stay_start, $form.stay_end],
                onChange(selectedDates, dateStr) {
                    $form.stay_start = dateStr.substring(0, 10)
                    $form.stay_end = dateStr.substring(14)
                    if ($form.stay_start !== '')
                        document.getElementById('form-stay_start').focus()
                    if ($form.stay_end !== '') {
                        document.getElementById('form-stay_end').focus()
                        setTimeout(() => document.getElementById('form-stay_end').blur(), 0)
                    }
                }
            })
        else
            datePicker = flatpickr('#form-date', {
                monthSelectorType: 'static'
            })
    }

    function computeDateStuff() {
        if ($form.stay_start !== '' && $form.stay_end !== '') {
            const startDate = DateTime.fromSQL($form.stay_start)
            const endDate = DateTime.fromSQL($form.stay_end)
            const dateString = startDate.toLocaleString() + ' à ' + endDate.toLocaleString()
            // if (!String($form.stay_label).includes(dateString))
            stayDisplayLabelString = $settings.text_stay + ' ' + dateString
            // if (!excludeStayAmount) {
            //     const days = Interval.fromDateTimes(startDate, endDate).length('days')
            //     $form.stay_amount = days <= $settings.short_stay_duration ? days * $settings.price_stay_short : days * $settings.price_stay
            // }
        }
        calcTotal()
    }

    function selectPaymentType(event) {
        handleChange(event)
        hasPaymentType = $form.payment_type !== ''
        if ($form.payment_type === 'cash' || $form.payment_type === 'cheque')
            $form.invoice_nr = $form.invoice_nr.substring(0, 6).concat('CB')
        else
            $form.invoice_nr = $form.invoice_nr.substring(0, 6)
    }

    function calcTotal() {
        total = Number($form.stay_amount) + Number($form.membership_amount) + Number($form.meals_amount) + Number($form.custom_amount)
    }

    async function deleteMe() {
        if (invoice !== null && invoice.id !== null && confirm("Are you sure to delete this invoice?")) {
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
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">
    {#if !edit && !dispatched}
        New invoice
    {:else if !dispatched}
        Edit invoice
        {#if $role === 'admin' || $role === 'root'}
            <button class="uk-button uk-text-normal uk-margin uk-button-secondary uk-position-bottom-right uk-button-danger" type="button" on:click={deleteMe}>Delete</button>
        {/if}
    {:else if edit}
        Updating invoice
    {:else }
        Creating invoice
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

        <div class="uk-margin-medium uk-margin-small-bottom">
            <label class="uk-form-label" for="form-invoice-type">Invoice</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l uk-margin-small-bottom" id="form-invoice-type" uk-grid>
                <div class="uk-width-1-1@s uk-inline">
                    <select class="uk-select"  id="form-payment_type" name="payment_type" type="text" on:change={selectPaymentType} bind:value={$form.payment_type}>
                        <option value="" selected>Select payment type:</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="transfer">Bank transfer</option>
                    </select>
                </div>
            </div>
        </div>
        {#if hasPaymentType}
            <div class="uk-margin-medium uk-margin-remove-top">
                <label class="uk-form-label" for="form-invoice"></label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-invoice" uk-grid>
                    <div class="uk-width-1-2@s uk-inline">
                        <input class="uk-input" id="form-invoice_nr" name="invoice_nr" type="text" placeholder="Invoice Nr" maxlength="8"
                               class:uk-form-danger={!okInvoiceNr || ($errors.invoice_nr && $touched.invoice_nr)} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.invoice_nr}>
                        <span class="uk-label uk-label-success uk-position-center-right uk-margin-small-right">{$form.payment_type}</span>
                    </div>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-date" name="date" type="text" placeholder="Invoice Date" readOnly
                               class:uk-form-danger={$errors.date && $touched.date} style="color: black" on:focus={attachDatePicker(false)}
                               on:change={handleChange} on:blur={handleChange} bind:value={$form.date}>
                    </div>
                    {#if !okInvoiceNr}
                        <div class="uk-width-1-1 uk-text-danger">
                            Invoice Nr already in use!
                        </div>
                    {/if}
                    {#if invoiceWarning}
                        <div class="uk-width-1-1 uk-text-warning">
                            Invoice Nr is not consecutive or wrong type. Only proceed if you know what you're doing!
                        </div>
                    {/if}
                </div>
            </div>
            <div class="uk-margin-medium">
                <label class="uk-form-label" for="form-personals">Personals</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-personals" uk-grid>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input uk-form-width-large" id="form-name" name="name" type="text" placeholder="Name"
                               class:uk-form-danger={$errors.name && $touched.name} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.name}>
                    </div>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-email-no1pw-search" name="email" type="email" placeholder="Email" autocomplete="'off"
                               class:uk-form-danger={$errors.email && $touched.email} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.email}>
                    </div>
                    <div class="uk-width-1-2@s"></div>
                    <div class="uk-width-1-2@s">
                        <div class="uk-width-1-1 uk-text-warning uk-align-right">
                            Please ensure that this email address is valid!
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-address" name="address" type="text" placeholder="Address"
                               class:uk-form-danger={$errors.address && $touched.address} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.address}>
                    </div>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-zip" name="zip" type="text" placeholder="ZIP"
                               class:uk-form-danger={$errors.zip && $touched.zip} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.zip}>
                    </div>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-city" name="city" type="text" placeholder="City"
                               class:uk-form-danger={$errors.city && $touched.city} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.city}>
                    </div>
                    <div class="uk-width-1-2@s">
                        <select class="uk-select" id="form-country" name="country" type="text"
                                class:uk-form-danger={$errors.country && $touched.country} style="color: black"
                                on:change={handleChange} on:blur={handleChange}>
                            {#if invoice === undefined || invoice === null || invoice.country === null || invoice.country === ''
                            || $form.country === null || $form.country === '' }
                                <option value="" selected>Please select country</option>
                            {/if}
                            {#each countryArray as country}
                                {#if (invoice !== undefined && invoice !== null && invoice.country === country.title)
                                || ($form.country === country.title)}
                                    <option value="{country.title}" selected>{country.title}</option>
                                {:else}
                                    <option value="{country.title}">{country.title}</option>
                                {/if}
                            {/each}
                        </select>
                    </div>
                </div>
            </div>
            <div class="uk-margin-medium">
                <label class="uk-form-label" for="form-dates">Dates</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-dates" uk-grid>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-stay_start" name="stay_start" type="text" placeholder="Arrival" readOnly
                               class:uk-form-danger={needDates} style="color: black" on:focus={attachDatePicker(true)}
                               on:change={handleChange} on:blur={handleChange} bind:value={$form.stay_start}>
                    </div>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input" id="form-stay_end" name="stay_end" type="text" placeholder="Departure" readOnly
                               class:uk-form-danger={needDates} style="color: black"
                               on:change={handleChange} on:blur={() => handleChange && computeDateStuff(false)} bind:value={$form.stay_end}>
                    </div>
                </div>
            </div>
            <div class="uk-margin-small">
                <label class="uk-form-label" for="form-accounting">Stay</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-accounting" uk-grid>
                    <div class="uk-width-5-6@s uk-text-small" class:uk-text-muted={Number($form.stay_amount) === 0}>
                        &nbsp; {stayDisplayLabelString}
                    </div>
                    <div class="uk-width-1-6@s">
                        <input class="uk-input" id="form-stay_amount" name="stay_amount" type="text" placeholder="0"
                               class:uk-form-danger={$errors.stay_amount} style="color: black"
                               on:keyup={handleChange && calcTotal} on:blur={handleChange} bind:value={$form.stay_amount}>
                    </div>
                </div>
            </div>
            <div class="uk-margin-small">
                <label class="uk-form-label" for="form-membership">Membership</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-membership" uk-grid>
                    <div class="uk-width-5-6@s uk-text-small" class:uk-text-muted={Number($form.membership_amount) === 0}>
                        &nbsp; {$settings.text_membership}
                    </div>
                    <div class="uk-width-1-6@s">
                        <input class="uk-input" id="form-membership_amount-no1pw-search" name="membership_amount" type="text"
                               class:uk-form-danger={$errors.membership_amount} style="color: black"
                               on:keyup={handleChange && calcTotal} on:blur={handleChange} bind:value={$form.membership_amount}>
                    </div>
                </div>
            </div>
            <div class="uk-margin-small">
                <label class="uk-form-label" for="form-meals">Meals</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-meals" uk-grid>
                    <div class="uk-width-5-6@s uk-text-small" class:uk-text-muted={Number($form.meals_amount) === 0}>
                        &nbsp; {$settings.text_meals}
                    </div>
                    <div class="uk-width-1-6@s">
                        <input class="uk-input" id="form-meals_amount" name="meals_amount" type="text" placeholder="0"
                               class:uk-form-danger={$errors.meals_amount} style="color: black"
                               on:keyup={handleChange && calcTotal} on:blur={handleChange} bind:value={$form.meals_amount}>
                    </div>
                </div>
            </div>
            <div class="uk-margin-small">
                <label class="uk-form-label" for="form-custom">Custom</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-custom" uk-grid>
                    <div class="uk-width-5-6@s">
                        <input class="uk-input" id="form-custom_label" name="custom_label" type="text" placeholder="Label text custom"
                               class:uk-form-danger={!okCustom} style="color: black"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.custom_label}>
                    </div>
                    <div class="uk-width-1-6@s">
                        <input class="uk-input" id="form-custom_amount" name="custom_amount" type="text" placeholder="0"
                               class:uk-form-danger={$errors.custom_amount} style="color: black"
                               on:keyup={handleChange && calcTotal} on:blur={handleChange} bind:value={$form.custom_amount}>
                    </div>
                </div>
            </div>
            <div class="uk-margin-medium">
                <label class="uk-form-label" for="form-total"></label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-total" uk-grid>
                    <div class="uk-width-5-6@s uk-text-emphasis uk-text-bold">&nbsp; TOTAL</div>
                    <div class="uk-width-1-6@s uk-text-emphasis uk-text-bold">&nbsp; {total} €</div>
                </div>
            </div>
            <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
                <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
                {#if !edit || $role === 'admin' || $role === 'root'}
                    <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                            on:mousedown={forceValidate} disabled={!$isValid || needDates || !okInvoiceNr || !okCustom}
                            class:uk-button-primary={$isValid && !needDates && okInvoiceNr && okCustom}>{edit ? 'Update' : 'Create'}</button>
                {/if}
            </div>
        {/if}
    </form>
{/if}