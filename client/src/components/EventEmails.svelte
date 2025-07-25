<script>
    import {DateTime} from "luxon"
    import {createEventDispatcher, onMount} from "svelte";
    import {getBookingsByIds} from "../stores/booking";
    import {updateEvent} from "../stores/event";


    export let event = undefined

    let bookings = []
    let bookingsConfirmed = 0
    let bookingsWaiting = 0
    let dispatched = false

    const dispatch = createEventDispatcher()

    onMount(async () => {
        if (event !== undefined && event !== null && event.bookings !== null && event.bookings.length >0) {
            bookings = await getBookingsByIds(event.bookings.map(b => b.id))
            if (bookings === null)
                bookings = []
            bookings.forEach(b => {
                let eventBooking = event.bookings.find(eb => eb.id === b.id)
                b.confirmed = eventBooking !== undefined ? eventBooking.confirmed : false
                if (b.confirmed)
                    bookingsConfirmed += b.people_count
                else
                    bookingsWaiting += b.people_count
            })
        }
    })

    function cancel() {
        dispatch('message', {
            goto: 'cancel'
        })
    }
</script>

{#if event !== undefined && event !== null}
    <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom">{event.name}</h4>
    <div class="uk-margin-medium uk-padding uk-background-muted uk-text-emphasis">
        <div class="uk-grid-small" uk-grid>
            <div class="uk-width-2-3">
                <span class="uk-text-muted">Contact:</span> {event.contact_email !== null && event.contact_email.length > 0 ? event.contact_email : ''}<br>
                <span class="uk-text-muted">Announcement:</span> {event.announcement_link !== null && event.announcement_link.length > 0 ? event.announcement_link : ''}
            </div>
            <div class="uk-width-1-3">
                <span class="uk-align-right">
                    {DateTime.fromSQL(event.start_date).toFormat('dd LLL yyyy')} - {DateTime.fromSQL(event.end_date).toFormat('dd LLL yyyy')}<br>
                    <span class="uk-text-muted">Participants: </span>
                    {#if event.max_participants !== null && event.max_participants > 0}
                        <span class="uk-text-bold"
                              class:uk-text-success={event.participant_count <= event.max_participants}
                              class:uk-text-danger={event.participant_count > event.max_participants}>{event.participant_count}</span>
                        <span class="uk-text-bold"> / {event.max_participants}</span>
                    {:else}
                        <span class="uk-text-bold">{event.participant_count}</span>
                    {/if}
                </span>
            </div>
            <div class="uk-width-1-1">
                <div class="uk-form-controls" id="form-info">
                    <textarea class="uk-textarea" rows="3" placeholder="Notes" readonly bind:value={event.info}></textarea>
                </div>
            </div>
        </div>
    </div>
    {#if event.bookings !== undefined && event.bookings?.length > 0 && bookings.length > 0}
        {#key bookingsConfirmed}
            <div class="uk-margin-medium">
                <h3 class="uk-heading-line uk-text-center uk-text-light"><span>Confirmed bookings:
                    <span class ="uk-text-light"
                          class:uk-text-bold={bookingsConfirmed > event.max_participants}
                          class:uk-text-danger={bookingsConfirmed > event.max_participants}>{bookingsConfirmed}</span></span></h3>
                <ul class="uk-list uk-list-collapse">
                {#each bookings as booking}
                    {#if booking.confirmed}
                        <li>{booking.email}</li>
                    {/if}
                {/each}
                </ul>
            </div>
            {#if bookingsWaiting > 0}
                <div class="uk-margin-medium">
                    <h3 class="uk-heading-line uk-text-center uk-text-light"><span>Waiting list: <span class ="uk-text-light">{bookingsWaiting}</span></span></h3>
                    <ul class="uk-list uk-list-collapse">
                    {#each bookings as booking}
                        {#if !booking.confirmed}
                            <li>{booking.email}</li>
                        {/if}
                    {/each}
                    </ul>
                </div>
            {/if}
        {/key}
        <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
            <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
        </div>
    {:else}
        <div class="uk-flex uk-flex-center uk-margin-medium">
            No bookings so far :(
        </div>
        <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
            <button class="uk-button uk-button-default" type="button" on:click={cancel}>Cancel</button>
        </div>
    {/if}
{/if}