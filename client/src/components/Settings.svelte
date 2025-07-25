<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {screenWidthL} from '../stores/navigation'
    import {createForm} from 'svelte-forms-lib'
    import * as yup from 'yup'
    import {role, settings, updateSettings} from '../stores/api'
    import UIkit from 'uikit'


    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            price_meals: 0,
            price_membership: 0,
            short_stay_duration: 0,
            price_stay_month: 0,
            price_stay: 0,
            price_stay_short: 0,
            mattress_membership: 0,
            house_capacity: 0,
            text_meals: '',
            text_membership: '',
            text_stay: '',
            sci_days: 0,
            app_version: ''
        },
        onSubmit: () => save(),
        validationSchema: yup.object().shape({
            price_meals: yup.number().min(0),
            price_membership: yup.number().min(0),
            short_stay_duration: yup.number().min(0),
            price_stay_month: yup.number(),
            price_stay: yup.number().min(0),
            price_stay_short: yup.number().min(0),
            mattress_membership: yup.number().min(0),
            house_capacity: yup.number().min(0),
            text_meals: yup.string(),
            text_membership: yup.string(),
            text_stay: yup.string(),
            sci_days: yup.number().min(0),
            app_version: yup.string()
        })
    })

    onMount(() => resetForm())

    async function save() {
        let success = await updateSettings($form)
        if (success)
            UIkit.notification('<span uk-icon="icon: check"></span> Default settings updated!', {status:'success', pos: 'bottom-center'});
        else
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'});
        dispatchReload()
    }

    function resetForm() {
        $form.price_meals = $settings.price_meals
        $form.price_membership = $settings.price_membership
        $form.short_stay_duration = $settings.short_stay_duration
        $form.price_stay = $settings.price_stay
        $form.price_stay_short = $settings.price_stay_short
        $form.price_stay_month = $settings.price_stay_month
        $form.mattress_membership = $settings.mattress_membership
        $form.house_capacity = $settings.house_capacity
        $form.text_meals = $settings.text_meals
        $form.text_membership = $settings.text_membership
        $form.text_stay = $settings.text_stay
        $form.sci_days = $settings.sci_days
        $form.app_version = $settings.app_version
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'settings'
        })
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-width-1-1">Default settings</h4>
        <form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>
            <div class="uk-margin-medium">
                <div class="uk-grid-small uk-margin-remove-left" uk-grid>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-short_stay_duration">Short stay days</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-short_stay_duration" name="short_stay_duration" type="text"
                                   class:uk-form-danger={($errors.short_stay_duration && $touched.short_stay_duration)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.short_stay_duration}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-sci_days">SCI free days</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-sci_days" name="sci_days" type="text"
                                   class:uk-form-danger={($errors.sci_days && $touched.sci_days)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.sci_days}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-price_stay">Daily price regular stay</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-price_stay" name="price_stay" type="text"
                                   class:uk-form-danger={($errors.price_stay && $touched.price_stay)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.price_stay}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-price_stay_short">Daily price short stay</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-price_stay_short" name="price_stay_short" type="text"
                                   class:uk-form-danger={($errors.price_stay_short && $touched.price_stay_short)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.price_stay_short}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-price_membership">Membership price</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-price_membership" name="price_membership" type="text"
                                   class:uk-form-danger={($errors.price_membership && $touched.price_membership)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.price_membership}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-price_stay_month">Monthly price (per day)</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-price_stay_month" name="price_stay_month" type="text"
                                   class:uk-form-danger={($errors.price_stay_month && $touched.price_stay_month)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.price_stay_month}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-mattress_membership">Mattress membership cut</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-mattress_membership" name="mattress_membership" type="text"
                                   class:uk-form-danger={($errors.mattress_membership && $touched.mattress_membership)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.mattress_membership}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-house_capacity">House capacity</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-house_capacity" name="house_capacity" type="text"
                                   class:uk-form-danger={($errors.house_capacity && $touched.house_capacity)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.house_capacity}>
                        </div>
                    </div>
                    <div class="uk-width-1-2@s">
                        <label class="uk-form-label" for="form-price_meals">Meal price (PAF events)</label>
                        <div class="uk-form-controls">
                            <input class="uk-input uk-form-width-small" id="form-price_meals" name="price_meals" type="text"
                                   class:uk-form-danger={($errors.price_meals && $touched.price_meals)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.price_meals}>
                        </div>
                    </div>
                    {#if $role === 'root'}
                        <div class="uk-width-1-2@s">
                            <label class="uk-form-label" for="form-app_version">App version</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-form-width-small" id="form-app_version" name="app_version" type="text"
                                       class:uk-form-danger={($errors.app_version && $touched.app_version)} style="color: black"
                                       on:keyup={handleChange} on:blur={handleChange} bind:value={$form.app_version}>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            <div class="uk-margin-medium">
                <div class="uk-grid-small uk-margin-remove-left" uk-grid>
                    <div class="uk-width-1-1@s">
                        <label class="uk-form-label" for="form-text_stay">Invoice text stay</label>
                        <div class="uk-form-controls">
                            <input class="uk-input" id="form-text_stay" name="text_stay" type="text"
                                   class:uk-form-danger={($errors.text_stay && $touched.text_stay)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.text_stay}>
                        </div>
                    </div>
                    <div class="uk-width-1-1@s">
                        <label class="uk-form-label" for="form-text_membership">Invoice text membership</label>
                        <div class="uk-form-controls">
                            <input class="uk-input" id="form-text_membership" name="text_membership" type="text"
                                   class:uk-form-danger={($errors.text_membership && $touched.text_membership)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.text_membership}>
                        </div>
                    </div>
                    <div class="uk-width-1-1@s">
                        <label class="uk-form-label" for="form-text_stay">Invoice text meal</label>
                        <div class="uk-form-controls">
                            <input class="uk-input" id="form-text_meals" name="text_meals" type="text"
                                   class:uk-form-danger={($errors.text_meals && $touched.text_meals)} style="color: black"
                                   on:keyup={handleChange} on:blur={handleChange} bind:value={$form.text_meals}>
                        </div>
                    </div>
                </div>
            </div>
            <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
                <button class="uk-button uk-button-default" type="button" on:click={resetForm}>Reset</button>
                <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                        disabled={!$isValid} class:uk-button-primary={$isValid}>Update</button>
            </div>
        </form>
    </div>
</div>