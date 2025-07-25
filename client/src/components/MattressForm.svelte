<script>
    import {role} from '../stores/api'
    import {createEventDispatcher, onMount} from 'svelte'
    import { createForm } from 'svelte-forms-lib'
    import * as yup from 'yup'
    import {screenWidthL} from '../stores/navigation'
    import BookingFormComponent from './BookingFormComponent.svelte'
    import {DateTime} from 'luxon'
    import {calculateBookingAmounts} from '../stores/booking'


    export let balance = 0
    export let transaction = undefined
    export let booking = undefined

    let bookingLoaded = false
    let edit = false
    let hasTransactionType = false
    let bookingFormValid = false
    let formValid = false
    let dispatched = false

    $: bookingFormValid && handleUpdate()

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            allocator: '',
            transaction: '',
            type: '',
            name: '',
            description: '',
            amount: 0
        },
        onSubmit: values => {
            if (!dispatched && ($form.transaction !== 'credit' || confirm('Please ensure the source of income is clearly described'))) {
                dispatched = true
                if (transaction === null)
                    transaction = {}
                handleUpdate()
                Object.entries(values).forEach(e => transaction[e[0]] = e[1])
                if (booking) {
                    booking.mattress_booking = true
                    if (!booking.paid && $form.transaction === 'debit') {
                        booking.paid = true
                        booking.date_paid = DateTime.now().toSQLDate()
                    }
                    if (booking.paid && $form.transaction === 'reserve') {
                        booking.paid = false
                        booking.date_paid = null
                    }
                }
                dispatch('message', {
                    goto: 'save',
                    booking: $form.transaction !== 'credit' && $form.type === 'paf' && bookingFormValid ? booking : null
                })
            }
        },
        validationSchema: yup.object().shape({
            allocator: yup.string().min(3).max(128).required(),
            transaction: yup.string().required(),
            type: yup.string().required(),
            name: yup.string().min(3).max(128).required(),
            description: yup.string().min(3).max(512),
            amount: yup.number().transform((number, string) => string === '' ? 0 : Number(string)).min(1)
        })
    })

    onMount(async () => {

        if (transaction !== undefined && booking !== undefined) {

            edit = transaction != null

            $form.allocator = transaction !== null && transaction.allocator !== null ? transaction.allocator : ''
            $form.transaction = transaction !== null && transaction.transaction !== null ? transaction.transaction : ''
            $form.type = transaction !== null && transaction.type !== null ? transaction.type : ''
            $form.name = transaction !== null && transaction.name !== null ? transaction.name : ''
            $form.description = transaction !== null && transaction.description !== null ? transaction.description : ''
            $form.amount = transaction !== null && transaction.amount !== null ? transaction.amount : ''

            // ugly hack to get force evaluate isValid
            if (transaction === null)
                handleSubmit(null)
            setTimeout(() => formValid = $isValid && (($form.transaction !== 'credit' && $form.type === 'paf' && bookingFormValid) || !($form.transaction !== 'credit' && $form.type === 'paf')), 100)

            hasTransactionType = $form.transaction !== ''
        }
    })

    function selectTransactionType(event) {
        handleUpdate(event)
        hasTransactionType = $form.transaction !== ''
        if (!edit)
            $form.type = ''
    }

    function handleUpdate(event) {
        if ($form.transaction !== 'credit' && $form.type === 'paf' && bookingFormValid) {
            $form.name = booking?.name
            $form.amount = calculateAmount()
            $touched.name = $touched.amount = true
            $errors.name = $errors.amount = ''
        }
        if (event)
            handleChange(event)
        setTimeout(() => formValid = $isValid && (($form.transaction !== 'credit' && $form.type === 'paf' && bookingFormValid) || !($form.transaction !== 'credit' && $form.type === 'paf')), 0)
    }

    function calculateAmount() {
        booking = calculateBookingAmounts(booking)
        return booking !== null ? booking.total_amount : 0
    }

    async function deleteMe() {
        if (transaction !== null && confirm("Are you sure to delete this transaction?")) {
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
        New transaction
    {:else if !dispatched}
        Edit transaction
        <button class="uk-button uk-text-normal uk-margin uk-button-secondary uk-position-bottom-right uk-button-danger" type="button" on:click={deleteMe}>Delete</button>
    {:else if edit}
        Updating transaction
    {:else}
        Creating transaction
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

        <div class="uk-margin-medium uk-margin-small-bottom">
            <label class="uk-form-label" for="form-transaction">Transaction</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l uk-margin-small-bottom" id="form-transaction" uk-grid>
                <div class="uk-width-1-1@s">
                    <select class="uk-select"  id="form-transaction" name="transaction" type="text" on:change={selectTransactionType} bind:value={$form.transaction}>
                        <option value="" selected disabled>Select transaction type:</option>
                        {#if !edit || (edit && transaction?.transaction !== 'credit')}
                            {#if balance > 0}
                                <option value="debit">Allocation</option>
                            {:else}
                                <option value="debit" disabled>Allocation (no funding)</option>
                            {/if}
                            <option value="reserve">Planned</option>
                        {/if}
                        {#if !edit || (edit && transaction?.transaction !== 'debit' && transaction?.transaction !== 'reserve')}
                            <option value="credit">Income</option>
                        {/if}
                    </select>
                </div>
            </div>
        </div>
        {#if hasTransactionType}
            <div class="uk-margin-medium uk-margin-remove-top uk-margin-small-bottom">
                <label class="uk-form-label" for="form-type">{$form.transaction === 'credit' ? 'Income from' : 'Expense for'}</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-type" uk-grid>
                    <div class="uk-width-1-1@s uk-inline">
                        {#if $form.transaction === 'credit'}
                            <select class="uk-select"  id="form-type" name="type" type="text" on:change={handleUpdate} bind:value={$form.type}>
                                <option value="" selected disabled>Select Income type:</option>
                                <option value="donation_squid">Donation cash</option>
                                <option value="donation_baguette">Donation cheque/transfer</option>
                                {#if $role === 'admin' | $role === 'root'}
                                    <option value="perfmts">PERFmts</option>
                                    <option value="wine">Wine</option>
                                {/if}
                            </select>
                        {:else}
                            <select class="uk-select"  id="form-type" name="type" type="text" on:change={handleUpdate} bind:value={$form.type}>
                                <option value="" selected disabled>Select Expense type:</option>
                                <option value="paf">PAF booking</option>
                                <option value="travel">Travel</option>
                                <option value="perdiem">Per diem</option>
                                <option value="other">Other</option>
                            </select>
                        {/if}
                        <span class="uk-label uk-label-success uk-position-center-right uk-margin-right">{$form.transaction === 'credit' ? 'Income' : $form.transaction === 'debit' ? 'Allocation' : 'Reservation'}</span>
                    </div>
                </div>
            </div>
            <div class="uk-margin-medium uk-margin-remove-top">
                <label class="uk-form-label" for="form-alllocator">Allocator</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-allocator" uk-grid>
                    <div class="uk-width-1-2@s">
                        <input class="uk-input uk-form-width-large" id="form-allocator-no1pw-search" name="allocator" type="text" placeholder="Allocator's name"
                               class:uk-form-danger={$errors.allocator && $touched.allocator} style="color: black"
                               on:keyup={handleUpdate} on:blur={handleUpdate} bind:value={$form.allocator}>
                    </div>
                </div>
            </div>
            {#if $form.type !== 'paf'}
                <div class="uk-margin-medium uk-margin-small-bottom">
                    <label class="uk-form-label" for="form-name">{$form.transaction === 'credit' ? 'Source' : 'Name'}</label>
                    <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-name" uk-grid>
                        <div class="uk-width-1-2@s">
                            <input class="uk-input uk-form-width-large" id="form-name-no1pw-search" name="name" type="text" placeholder={$form.transaction === 'credit' ? 'Name, institution, …' : 'Person\'s name'}
                                   class:uk-form-danger={$errors.name && $touched.name} style="color: black"
                                   on:keyup={handleUpdate} on:blur={handleUpdate} bind:value={$form.name}>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="uk-margin-small">
                <label class="uk-form-label" for="form-description">Description</label>
                <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-Description" uk-grid>
                    <div class="uk-width-1-1">
                            <textarea class="uk-textarea" name="description"
                                      placeholder={$form.type === 'donation_baguette' ? 'Invoice number' : $form.type === 'donation_squid' ? 'Squid payment date' : 'Description'}
                                      class:uk-form-danger={$errors.description && $touched.description} style="color: black"
                                      on:keyup={handleUpdate} on:blur={handleUpdate} bind:value={$form.description}></textarea>
                    </div>
                </div>
            </div>
            {#if $form.transaction !== 'credit' && $form.type === 'paf'}
                <div class="uk-heading-small uk-heading-divider uk-margin-medium-bottom uk-width-1-1"></div>
                {#key bookingLoaded}
                    <BookingFormComponent bind:booking={booking} isMattressBooking={true} bind:formValid={bookingFormValid} />
                {/key}
            {:else}
                <div class="uk-margin-small">
                    <label class="uk-form-label" for="form-amount">Amount</label>
                    <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-amount" uk-grid>
                        <div class="uk-width-1-6@s">
                            <input class="uk-input" id="form-amount-no1pw-search" name="amount" type="text"
                                   class:uk-form-danger={$errors.amount && $touched.amount} style="color: black"
                                   on:keyup={handleUpdate} on:blur={handleUpdate} bind:value={$form.amount}>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
                <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
                <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                        disabled={!formValid} class:uk-button-primary={formValid}>{edit ? 'Update' : 'Create'}</button>
            </div>
        {/if}
    </form>
{/if}