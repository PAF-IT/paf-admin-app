<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {screenWidthL, screenWidthS} from '../stores/navigation'
    import {settings} from '../stores/api'
    import {createForm} from "svelte-forms-lib"
    import * as yup from "yup"
    import {DateTime} from "luxon"
    import {getMemberById} from "../stores/member"

    export let booking = undefined
    export let sciMember = undefined
    export let dispatched = false

    let membership = undefined
    let prevYearSciDaysUsed = 0
    let total = 0

    $: total = Number($form.stay_amount) + Number($form.membership_amount) + Number($form.meals_amount)

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            stay_rate: 0,
            institutional: false,
            sci_days_used: 0,
            stay_amount: 0,
            membership_amount: 0,
            meals_amount: 0,
            total_amount: 0
        },
        onSubmit: values => {

        },
        validationSchema: yup.object().shape({
            stay_rate: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            institutional: yup.bool(),
            sci_days_used: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            stay_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            membership_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            meals_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            total_amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string))
        })
    })

    onMount(async () => {
        if (booking !== undefined) {
            $form.stay_rate = booking !== null && booking.stay_rate !== null && booking.stay_rate > 0 ? booking.stay_rate : booking.stay_days <= booking.short_stay_duration ? $settings.price_stay_short : $settings.price_stay
            $form.institutional = booking !== null && booking.institutional !== null ? booking.institutional : false
            $form.sci_days_used = booking !== null && booking.sci_days_used !== null ? booking.sci_days_used : 0
            $form.stay_amount = booking !== null && booking.stay_amount !== null ? booking.stay_amount : 0
            $form.membership_amount = booking !== null && booking.membership_amount !== null ? booking.membership_amount : 0
            $form.meals_amount = booking !== null && booking.meals_amount !== null ? booking.meals_amount : 0
            $form.total_amount = booking !== null && booking.total_amount !== null ? booking.total_amount : 0

            // ugly hack to get force evaluate isValid
            if (booking === null)
                handleSubmit(null)

            if (booking?.member_id > 0) {
                let member = await getMemberById(booking.member_id)
                if (member)
                    membership = DateTime.fromSQL(member.renew_date) >= DateTime.now()
            }
        }
        adjustSciAmount(true)
    })

    function adjustStayAmount() {
        adjustSciAmount(false)
    }

    function adjustSciAmount(init) {
        if (!booking)
            return

        if (booking.no_stay_pay && init) {
            $form.sci_days_used = 0
            $form.stay_amount = 0
        } else {
            if (sciMember === undefined || sciMember === null)
                $form.sci_days_used = 0
            else if (DateTime.fromSQL(booking.arrival).year < DateTime.now().year) {
                let prevYearDays = Math.round(DateTime.fromSQL(booking.arrival).until(DateTime.fromSQL(booking.departure).year < DateTime.now().year ? DateTime.fromSQL(booking.departure) : DateTime.fromSQL(booking.arrival).endOf('year')).length('days'))
                let currYearDays = Math.round(DateTime.fromSQL(booking.departure).year < DateTime.now().year ? 0 : DateTime.now().startOf('year').until(DateTime.fromSQL(booking.departure)).length('days'))
                let prevYearSciDaysLeft = $settings.sci_days - sciMember.sci_days_used_prev_year
                let currYearSciDaysLeft = $settings.sci_days - sciMember.sci_days_used
                prevYearSciDaysUsed = prevYearDays > prevYearSciDaysLeft ? prevYearSciDaysLeft : prevYearDays
                let currYearSciDaysUsed = currYearDays > currYearSciDaysLeft ? currYearSciDaysLeft : currYearDays
                $form.sci_days_used = prevYearSciDaysUsed + currYearSciDaysUsed
            }
            else if ($form.sci_days_used > $settings.sci_days - sciMember.sci_days_used)
                $form.sci_days_used = $settings.sci_days - sciMember.sci_days_used
            if ($form.sci_days_used > booking.stay_days)
                $form.sci_days_used = booking.stay_days

            $form.stay_amount = (booking.stay_days - $form.sci_days_used) * $form.stay_rate

            // if booking is for more than one person, add amount for full period for the rest of
            $form.stay_amount += $form.people_count === 1 ? 0 : (booking.people_count - 1) * booking.stay_days * $form.stay_rate
            booking.stay_amount_orig = $form.stay_amount
        }
    }

    function preparePayment() {
        booking.sci_days_used = $form.sci_days_used
        booking.stay_rate = $form.stay_rate
        booking.institutional = $form.institutional
        booking.stay_amount = $form.stay_amount
        booking.membership_amount = $form.membership_amount
        booking.meals_amount = $form.meals_amount
        booking.total_amount = total
    }

    function cancel() {
        dispatch('message', {
            pay: 'cancel'
        })
    }

    function invoice() {
        preparePayment()
        dispatch('message', {
            pay: 'invoice',
            prevYearSciDaysUsed: prevYearSciDaysUsed
        })
    }

    function squid() {
        preparePayment()
        dispatch('message', {
            pay: 'squid',
            prevYearSciDaysUsed: prevYearSciDaysUsed
        })
    }
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom">
    {#if !dispatched}
        Payment
    {:else }
        Payment processing
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

        <div class="uk-margin-medium uk-padding uk-text-justify uk-background-muted uk-text-emphasis" class:uk-text-small={$screenWidthS}>
            {#if booking}
                <p class="uk-text-lead uk-inline uk-width-1-1" class:uk-text-small={$screenWidthS} class:uk-text-bold={$screenWidthS}>
                    {booking.name}
                    {#if membership === undefined || booking.people_count > 1}
                        <span class="uk-label uk-label-warning uk-position-center-right uk-margin-small-right">Membership</span>
                    {:else if membership}
                        <span class="uk-label uk-label-success uk-position-center-right uk-margin-small-right">Membership</span>
                    {:else}
                        <span class="uk-label uk-label-danger uk-position-center-right uk-margin-small-right">Membership</span>
                    {/if}
                </p>
                <div class="uk-inline uk-width-1-1">
                    {DateTime.fromSQL(booking.arrival).toFormat('dd LLL yyyy') + ' - ' + DateTime.fromSQL(booking.departure).toFormat('dd LLL yyyy')}
                    {#if booking?.paf_events?.length > 0}
                        {#each booking.paf_events as pafEvent}
                            &nbsp; <span class="uk-label uk-label-success" class:uk-label-danger={!pafEvent.confirmed}>{pafEvent.abbreviation}</span>
                        {/each}
                    {/if}
                    <br>
                    <span class="uk-text-bold">{booking.people_count}</span> people, <span class="uk-text-bold">{booking.stay_days}</span> nights
                    <span class="uk-text-meta uk-text-right uk-position-top-right uk-margin-small-right">
                        {#if membership === undefined || booking.people_count > 1}
                            Please check their membership/s<br>
                            {#if booking.people_count === 1}
                                No membership is linked to this booking
                            {:else}
                                This booking is for multiple people
                            {/if}
                        {:else if membership}
                            Membership is valid
                        {:else}
                            Please create or renew their membership<br>Membership doesn't exist or is expired
                        {/if}
                    </span>
                </div>
            {/if}
        </div>
        <div class="uk-margin-medium">
            <div class="uk-grid-small uk-margin-remove-left@l" uk-grid>
                <div class="uk-width-1-2@s">
                    <label class="uk-form-label" for="form-stay_rate">Stay rate</label>
                    <div class="uk-form-controls uk-margin-small-bottom">
                        <input class="uk-input uk-width-1-4@s" id="form-stay_rate" name="stay_rate" type="text" placeholder="Rate" maxlength="4"
                               class:uk-form-danger={$errors.stay_rate && $touched.stay_rate} style="color: black"
                               on:keyup={handleChange && adjustStayAmount} on:blur={handleChange && adjustStayAmount} bind:value={$form.stay_rate}>
                        &nbsp;<span class="uk-text-meta">€ per night</span> &nbsp;<span uk-icon="icon: info" uk-tooltip="title: Adjust for sliding scale or institutional rate!"> </span>
                    </div>
                    <label class="uk-form-label" for="form-institutional">Institution</label>
                    <div class="uk-form-controls uk-margin-small-bottom">
                        <input class="uk-checkbox" id="form-institutional" name="institutional" type="checkbox"
                               on:change={handleChange} on:blur={handleChange} bind:checked={$form.institutional}>
                        &nbsp;<span class="uk-text-meta">Institutional rate</span> &nbsp;<span uk-icon="icon: info" uk-tooltip="title: Applies to groups with whom a higher price has been negotiated."> </span>
                    </div>
                    {#if booking?.sci_member && !booking?.no_stay_pay}
                        <div class="uk-margin-medium">
                            <label class="uk-form-label" for="form-sci_days_used">Use SCI days</label>
                            <input class="uk-input uk-margin-small-left uk-form-width-xsmall" id="form-sci_days_used" name="sci_days_used" type="text"
                                   class:uk-form-danger={$errors.sci_days_used && $touched.sci_days_used} style="color: black"
                                   on:keyup={() => {handleChange && adjustSciAmount(false)}} on:blur={handleChange} bind:value={$form.sci_days_used}>
                            &nbsp; ({$settings.sci_days - sciMember?.sci_days_used} left)
                        </div>
                    {/if}
                </div>
                <div class="uk-width-1-2@s">
                    <label class="uk-form-label" for="form-stay">Stay</label>
                    <div class="uk-form-controls uk-margin-small-bottom uk-width-1-4@s">
                        <input class="uk-input uk-form-width-large" id="form-stay_amount" name="stay_amount" type="text" placeholder="Stay amount"
                               class:uk-form-danger={$errors.stay_amount && $touched.stay_amount} style="color: black; text-align: right"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.stay_amount}>
                    </div>
                    <label class="uk-form-label" for="form-membership">Membership</label>
                    <div class="uk-form-controls uk-margin-small-bottom uk-width-1-4@s">
                        <input class="uk-input uk-form-width-large" id="form-membership_amount" name="membership_amount" type="text" placeholder="Membership amount"
                               class:uk-form-danger={$errors.membership_amount && $touched.membership_amount} style="color: black; text-align: right"
                               on:keyup={handleChange} on:blur={handleChange} bind:value={$form.membership_amount}>
                    </div>
                    {#if booking?.paf_events?.length > 0}
                        <label class="uk-form-label" for="form-meals_amount">Meals</label>
                        <div class="uk-form-controls uk-margin-small-bottom uk-width-1-4@s">
                            <input class="uk-input uk-form-width-large" id="form-meals_amount" name="meals_amount" type="text" placeholder="Meals amount"
                                   class:uk-form-danger={$errors.meals_amount && $touched.meals_amount} style="color: black; text-align: right"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.meals_amount}>
                        </div>
                    {/if}
                    <label class="uk-form-label uk-text-bold uk-margin-medium" for="form-total">TOTAL</label>
                    <div class="uk-form-controls uk-form-controls-text uk-margin-medium uk-width-1-4@s" id="form-total">
                        <div class="uk-text-right uk-text-bold uk-text-emphasis">{total}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
            <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
            <button class="uk-button uk-margin-xlarge-left" id="submit" type="submit"
                    on:click={squid} disabled={!$isValid}
                    class:uk-button-primary={$isValid}>Squid</button>
            <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                    on:click={invoice} disabled={!$isValid}
                    class:uk-button-primary={$isValid}>Invoice</button>
        </div>
    </form>
{/if}