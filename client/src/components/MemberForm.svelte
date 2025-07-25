<script>
    import { DateTime } from "luxon"
    import {createEventDispatcher, onMount} from "svelte"
    import { createForm } from "svelte-forms-lib"
    import * as yup from "yup"
    import flatpickr from "flatpickr"
    import {screenWidthL, screenWidthS} from "../stores/navigation"
    import {countryArray, memberEmails} from "../stores/member";

    export let member = undefined
    export let renew

    let okEmail

    $: okEmail = member !== null || !$memberEmails.includes($form.email)

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            name: '',
            email: '',
            address: '',
            zip: '',
            city: '',
            country: '',
            start_date: DateTime.now().toSQLDate(),
            agree: false,
            newsletter: true
        },
        onSubmit: values => {
            if (member === null)
                member = {}
            Object.entries(values).forEach(e => member[e[0]] = e[1])
            if (renew)
                member.renew_date = DateTime.now().plus({years:1}).toSQLDate()
            dispatch('message', {
                goto: 'signature'
            })
        },
        validationSchema: yup.object().shape({
            name: yup.string().min(4).required(),
            email: yup
                .string()
                .email()
                .required(),
            address: yup.string().min(4).required(),
            zip: yup.string().min(4).required(),
            city: yup.string().min(2).required(),
            country: yup.string().min(4).required(),
            start_date: yup.date().min(DateTime.now().minus({years:30}).toJSDate()).max(DateTime.now().plus({years:1}).toJSDate()).transform((date, string) => DateTime.fromSQL(string).toJSDate()).required(),
            agree: yup.bool().oneOf([true]),
            newsletter: yup.bool()
        })
    })

    onMount(() => {
        if (member !== undefined) {
            $form.name = member !== null && member.name !== null ? member.name : ''
            $form.email = member !== null && member.email !== null ? member.email : ''
            $form.address = member !== null && member.address !== null ? member.address : ''
            $form.zip = member !== null && member.zip !== null ? member.zip : ''
            $form.city = member !== null && member.city !== null ? member.city : ''
            $form.country = member !== null && member.country !== null ? member.country : ''
            $form.agree = member !== null
            $form.newsletter = member !== null && member.newsletter !== null ? member.newsletter : true

            // ugly hack to get force evaluate isValid
            if (member === null)
                handleSubmit(null)
        }

        flatpickr('#form-start_date', {
            monthSelectorType: 'static'
        })
    })

    function cancel() {
        dispatch('message', {
            goto: 'cancel'
        })
    }

    function jumpEdit() {
        dispatch('message', {
            goto: 'jumpEdit',
            email: $form.email
        })
    }
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom">
    {#if member === null}
        New Member
    {:else if renew !== undefined && renew}
        Renew Member
    {:else}
        Edit member
    {/if}
</h4>
<a id="terms"> </a>
<form class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

    {#if member === null}
        <div class="uk-margin-medium uk-padding uk-text-justify uk-background-muted uk-text-emphasis" class:uk-text-small={$screenWidthS}>
            <p class="uk-text-lead" class:uk-text-small={$screenWidthS} class:uk-text-bold={$screenWidthS}>PAF Membership Terms</p>
            PAF is a non-profit organization. The Act of 1st July 1901 applies to this organization. PAF is intended to the professionals and not-yet-professionals in the field of performing arts, visual art, music, film, literature, new media, theory and cultural production, who want to research and determine their own conditions of work. It is a platform for anyone who wishes to expand possibilities and interests in their own working practice. Initiated and run by artists, theoreticians, practitioners and activists themselves, PAF is an user-created informal institution. The organization disclaims all liability as long as the necessary restorations of the building are not made. Therefore PAF is not liable in case of any loss, material damage or personal injury occurred to current members and to non-members even in case of gross negligence. You hereby declare to have inspected the site and building. You declare awareness that the aforementioned site and building are not within accordance of the necessary safety codes. To ensure that every resident becomes a member of the organization PAF, they must sign this disclaimer.
        </div>
    {/if}
    <div class="uk-margin-medium">
        <label class="uk-form-label" for="form-personals">Name, Email</label>
        <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-personals" uk-grid>
            <div class="uk-width-1-2@s">
                <input class="uk-input uk-form-width-large" id="form-name-no1pw-search" name="name" type="text" placeholder="Name" autocomplete="'off"
                       class:uk-form-danger={$errors.name && $touched.name} style="color: black"
                       on:keyup={handleChange} on:blur={handleChange} bind:value={$form.name}>
            </div>
            <div class="uk-width-1-2@s uk-inline">
                {#if !okEmail}
                    <a class="uk-form-icon uk-form-icon-flip" on:click={jumpEdit} href={"#"} uk-icon="icon: file-edit" uk-tooltip="title: Edit member with this email"> </a>
                {/if}
                <input class="uk-input" id="form-email-no1pw-search" name="email" type="email" placeholder="Email" autocomplete="'off"
                       class:uk-form-danger={!okEmail || ($errors.email && $touched.email)} style="color: black"
                       on:keyup={handleChange} on:blur={handleChange} bind:value={$form.email}>
            </div>
            {#if !okEmail}
                {#if !$screenWidthS}
                    <div class="uk-width-1-2@s">
                        &nbsp;
                    </div>
                {/if}
                <div class="uk-width-1-2@s uk-text-danger">
                    Email already in use
                </div>
            {/if}
        </div>
    </div>
    <div class="uk-margin-medium">
        <label class="uk-form-label" for="form-addr">Address</label>
        <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-addr" uk-grid>
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
                    {#if member === undefined || member === null || member.country === null || member.country === ''}
                        <option value="" selected>Please select country</option>
                    {/if}
                    {#each countryArray as country}
                        {#if member !== undefined && member !== null && member.country === country.title}
                            <option value="{country.title}" selected>{country.title}</option>
                        {:else}
                            <option value="{country.title}">{country.title}</option>
                        {/if}
                    {/each}
                </select>
            </div>
        </div>
    </div>
    {#if member === null}
        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-start_date">Start date</label>
            <div class="uk-form-controls">
                <input class="uk-input" id="form-start_date" name="start_date" type="text" readonly
                       class:uk-form-danger={$errors.start_date && $touched.start_date} style="color: black"
                       on:change={handleChange} on:blur={handleChange} bind:value={$form.start_date}>
            </div>
        </div>
        <div class="uk-margin-medium">
            <label for="form-agree"></label>
            <div class="uk-form-controls">
                <input class="uk-checkbox" id="form-agree" name="agree" type="checkbox"
                       on:change={handleChange} on:blur={handleChange}
                       bind:value={$form.agree}> <span class::uk-text-danger={$errors.agree}> I hereby agree to <a class="uk-link-muted" href="#terms" uk-scroll>PAF's membership terms</a></span>
            </div>
            <label for="form-newsletter"></label>
            <div class="uk-form-controls">
                <input class="uk-checkbox" id="form-newsletter" name="newsletter" type="checkbox" checked
                       on:change={handleChange} on:blur={handleChange} bind:value={$form.newsletter}> I would like to receive occasional updates from PAF via email
            </div>
        </div>
    {/if}

    <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
        <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
        <button class="uk-button uk-margin-large-left" id="submit" type="submit"
                disabled={!$isValid || !okEmail} class:uk-button-primary={$isValid && okEmail}>{member !== null && renew !== undefined && renew === false ? 'Save' : 'Continue'}</button>
    </div>
</form>