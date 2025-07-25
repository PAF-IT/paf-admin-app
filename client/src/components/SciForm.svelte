<script>
    import {createEventDispatcher, onMount} from "svelte"
    import { createForm } from "svelte-forms-lib"
    import * as yup from "yup"
    import {screenWidthL} from "../stores/navigation"
    import {getMemberByName, memberNames, updateMember} from "../stores/member"
    import autoComplete from "@tarekraafat/autocomplete.js/dist/autoComplete"
    import UIkit from "uikit";


    export let member = undefined

    let newSciMember = null
    let alreadySciMember = false
    let dispatched = false

    const dispatch = createEventDispatcher()

    const { form, errors, touched, state, isValid, handleChange, handleSubmit } = createForm({
        initialValues: {
            name: ''
        },
        onSubmit: async values => {
            if (newSciMember !== null && !alreadySciMember && confirm('Are you sure to replace current SCI member ' + member.name + ' with ' + newSciMember.name + '?')) {
                dispatched = true
                member.sci_member = false
                newSciMember.sci_member = true
                if (await updateMember(member) && await updateMember(newSciMember))
                    UIkit.notification('<span uk-icon="icon: check"></span> SCI member replaced!', {status: 'success', pos: 'bottom-center'})
                else
                    UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {status: 'danger', pos: 'bottom-center'})
                dispatch('message', {
                    goto: 'save'
                })
            }
        },
        validationSchema: yup.object().shape({
            name: yup.string().min(4).required()
        })
    })

    onMount(() => {
        if (member !== undefined) {
            const autoCompleteJS = new autoComplete({
                selector: "#form-name",
                placeHolder: "Search for member...",
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
                            getMemberData(event.detail.selection.value)
                        },
                        keyup: () => {
                            if (autoCompleteJS.input.value === '')
                                getMemberData(null)
                        }
                    }
                }
            })
        }
    })

    async function getMemberData(name) {
        newSciMember = null
        if (name !== null) {
            newSciMember = await getMemberByName(name)
            if (newSciMember !== undefined && newSciMember !== null)
                newSciMember = newSciMember[0]
        }
        alreadySciMember = newSciMember !== null && newSciMember.sci_member !== null ? newSciMember.sci_member : false
        document.getElementById('form-name').focus()
        setTimeout(() => document.getElementById('form-name').blur(), 0)
    }

    function cancel() {
        dispatch('message', {
            goto: 'cancel'
        })
    }
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">
    {#if !dispatched}
        Replace SCI member
    {:else}
        Replacing SCI member
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <form id="sciMemberForm" class="uk-form" class:uk-form-horizontal={!$screenWidthL} on:submit={handleSubmit}>

        <div class="uk-margin-medium">
            <label class="uk-form-label" for="form-personals">New SCI member</label>
            <div class="uk-form-controls uk-grid-small uk-margin-remove-left@l" id="form-personals" uk-grid>
                <div class="uk-width-1-1">
                    <input class="uk-input" id="form-name" name="name" type="text" placeholder="Name"
                           class:uk-form-danger={$errors.name && $touched.name} style="color: black"
                           on:keyup={handleChange} on:blur={handleChange} bind:value={$form.name}>
                </div>
                {#if alreadySciMember}
                    <div class="uk-width-1-1 uk-text-danger">
                        This member is already an SCI member!
                    </div>
                {/if}
            </div>
        </div>

        <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
            <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
            <button class="uk-button uk-margin-large-left" id="submitBooking" type="submit"
                    disabled={!$isValid || newSciMember === null ||  alreadySciMember}
                    class:uk-button-primary={$isValid && newSciMember !== null && !alreadySciMember}>Save</button>
        </div>
    </form>
{/if}