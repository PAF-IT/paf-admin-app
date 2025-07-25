<script>
    import {DateTime} from 'luxon'
    import {createEventDispatcher, onMount} from 'svelte'
    import { createForm } from 'svelte-forms-lib'
    import * as yup from 'yup'
    import flatpickr from 'flatpickr'
    import {screenWidthL, screenWidthS} from '../stores/navigation'
    import {settings} from '../stores/api'


    export let event = undefined
    export let edit = false

    let dispatched = false

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            name: '',
            abbreviation: '',
            start_date: '',
            end_date: '',
            contact_email: '',
            announcement_link: '',
            max_participants: '',
            info: '',
            meal_price_day: ''
        },
        onSubmit: values => {
            dispatched = true
            if (event === null)
                event = {}
            Object.entries(values).forEach(e => event[e[0]] = e[1])
            event.max_participants = event.max_participants === '' || event.max_participants === 0 ? null : Number(event.max_participants)
            event.meal_price_day = event.meal_price_day === '' ? 0 : Number(event.meal_price_day)
            dispatch('message', {
                goto: 'save'
            })
        },
        validationSchema: yup.object().shape({
            name: yup.string().min(3).required(),
            abbreviation: yup.string().min(3).required(),
            start_date: yup.date().min(DateTime.now().minus({years:1}).toJSDate()).max(DateTime.now().plus({years:2}).toJSDate()).transform((date, string) => DateTime.fromSQL(string).toJSDate()).required(),
            end_date: yup.date().min(DateTime.now().minus({years:1}).toJSDate()).max(DateTime.now().plus({years:2}).toJSDate()).transform((date, string) => DateTime.fromSQL(string).toJSDate()).required(),
            contact_email: yup.string().email(),
            announcement_link: yup.string(),
            max_participants: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
            info: yup.string(),
            meal_price_day: yup.number().transform((number, string) => string === '' ? 0 : Number(string)),
        })
    })

    onMount(async () => {

        if (event !== undefined) {
            $form.name = event !== null && event.name !== null ? event.name : ''
            $form.abbreviation = event !== null && event.abbreviation !== null ? event.abbreviation : ''
            $form.start_date = event !== null && event.start_date !== null ? event.start_date : ''
            $form.end_date = event !== null && event.end_date !== null ? event.end_date : ''
            $form.contact_email = event !== null && event.contact_email !== null ? event.contact_email : ''
            $form.announcement_link = event !== null && event.announcement_link !== null ? event.announcement_link : ''
            $form.max_participants = event !== null && event.max_participants !== null ? event.max_participants : $settings.house_capacity
            $form.info = event !== null && event.info !== null ? event.info : ''
            $form.meal_price_day = event !== null && event.meal_price_day !== null && event.meal_price_day !== 0 ? event.meal_price_day : ''

            // ugly hack to get force evaluate isValid
            if (event === null)
                handleSubmit(null)
        }

        flatpickr('#form-date', {
            monthSelectorType: 'static'
        })
        flatpickr('#form-dates', {
            monthSelectorType: 'static',
            mode: 'range',
            defaultDate: [$form.start_date, $form.end_date],
            onChange(selectedDates, dateStr) {
                $form.start_date = dateStr.substring(0, 10)
                $form.end_date = dateStr.substring(14)
                if ($form.start_date !== '')
                    document.getElementById('form-start_date').focus()
                if ($form.end_date !== '') {
                    document.getElementById('form-end_date').focus()
                    setTimeout(() => document.getElementById('form-end_date').blur(), 0)
                }
            }
        })
    })

    async function deleteMe() {
        if (event !== null && event.id !== null && confirm("Are you sure to delete this event?")) {
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
        New event
    {:else if !dispatched}
        Edit { $screenWidthS ? '' : 'event'}
        <button class="uk-button uk-text-normal uk-margin uk-button-secondary uk-position-bottom-right uk-button-danger" type="button" on:click={deleteMe}>Delete</button>
    {:else if edit}
        Updating event
    {:else }
        Creating event
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-event">Event</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-event" uk-grid>
                <div class="uk-width-3-4@s">
                    <input class="uk-input" id="form-name" name="name" type="text" placeholder="Name"
                           class:uk-form-danger={($errors.name && $touched.name)} style="color: black"
                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.name}>
                </div>
                <div class="uk-width-1-4@s">
                    <input class="uk-input" id="form-abbreviation" name="abbreviation" type="text" placeholder="Short"  maxlength="8"
                           class:uk-form-danger={$errors.abbreviation && $touched.abbreviation} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.abbreviation}>
                </div>
            </div>
        </div>
        <div class="uk-margin-small">
            <label class="uk-form-label" for="form-dates">Dates</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-dates" uk-grid>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-start_date" name="start_date" type="text" placeholder="Start" readOnly
                           class:uk-form-danger={$errors.start_date && $touched.start_date} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.start_date}>
                </div>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-end_date" name="end_date" type="text" placeholder="End" readOnly
                           class:uk-form-danger={$errors.end_date && $touched.end_date} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.end_date}>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-orga">Organisation</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-orga" uk-grid>
                <div class="uk-width-1-1@s">
                    <input class="uk-input" id="form-announcement_link" name="announcement_link" type="text" placeholder="Announcement link"
                           class:uk-form-danger={$errors.announcement_link && $touched.announcement_link} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.announcement_link}>
                </div>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-contact_email" name="contact_email" type="text" placeholder="Contact email"
                           class:uk-form-danger={$errors.contact_email && $touched.contact_email} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.contact_email}>
                </div>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-max_participants" name="max_participants" type="text" placeholder="Max participants"
                           class:uk-form-danger={$errors.max_participants && $touched.max_participants} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.max_participants}>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-info">Notes</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-info" uk-grid>
                <div class="uk-width-1-1">
                <textarea class="uk-textarea" name="info" rows="3"
                          class:uk-form-danger={$errors.info && $touched.info} style="color: black"
                          on:keyup={handleChange} on:blur={handleChange} bind:value={$form.info}></textarea>
                </div>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-prices">Meal price</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-prices" uk-grid>
                <div class="uk-width-1-2@s">
                    <input class="uk-input" id="form-meal_price_day" name="meal_price_day" type="text" placeholder="Meal price / day"
                           class:uk-form-danger={$errors.meal_price_day && $touched.meal_price_day} style="color: black"
                           on:change={handleChange} on:blur={handleChange} bind:value={$form.meal_price_day}>
                </div>
            </div>
        </div>
        <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
            <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
            <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                    disabled={!$isValid} class:uk-button-primary={$isValid}>{edit ? 'Update' : 'Create'}</button>
        </div>
    </form>
{/if}