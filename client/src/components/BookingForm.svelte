<script>
    import {createEventDispatcher} from 'svelte'
    import {screenWidthS} from '../stores/navigation'
    import BookingFormComponent from './BookingFormComponent.svelte'


    export let booking = undefined
    export let edit = false

    let dispatched = false
    let formValid = false

    const dispatch = createEventDispatcher()

    async function deleteMe() {
        if (booking !== null && booking.id !== null && confirm("Are you sure to delete this booking?")) {
            dispatch('message', {
                goto: 'delete'
            })
        }
    }

    function submit() {
        dispatched = true
        dispatch('message', {
            goto: 'save'
        })
    }

    function cancel() {
        dispatch('message', {
            goto: 'cancel'
        })
    }

</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">
    {#if !edit && !dispatched}
        New booking
    {:else if !dispatched}
        Edit { $screenWidthS ? '' : 'booking'}
        {#if booking?.cancelled}
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
    <BookingFormComponent bind:booking={booking} isMattressBooking={false} bind:formValid={formValid} />
    <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
        <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
        {#if booking?.paid}
            <button class="uk-button uk-margin-large-left" id="submitBooking" type="submit" disabled>Can't alter (paid)</button>
        {:else}
            <button class="uk-button uk-margin-large-left" id="submitBooking" type="submit" on:click={submit}
                    disabled={!formValid} class:uk-button-primary={formValid}>Save</button>
        {/if}
    </div>
{/if}