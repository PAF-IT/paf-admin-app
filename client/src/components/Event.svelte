<script>
    import {createEventDispatcher, onMount} from "svelte"
    import UIkit from "uikit";
    import {screenWidthL, screenWidthM, screenWidthS} from "../stores/navigation"
    import autoComplete from "@tarekraafat/autocomplete.js/dist/autoComplete"
    import {DateTime} from "luxon"
    import {createEvent, deleteEvent, events, updateEvent} from "../stores/event"
    import EventForm from "./EventForm.svelte"
    import EventParticipants from "./EventParticipants.svelte"
    import EventEmails from "./EventEmails.svelte";


    let data = []
    let selectedEvent
    let editEvent = false
    let recreateForm = false
    let recreateList = false

    // $: $events && initAutoComplete()

    const dispatch = createEventDispatcher()

    onMount(async () => {

        assignData(null)

        const autoCompleteJS = new autoComplete({
            selector: "#autocomplete",
            placeHolder: "Search events...",
            diacritics: true,
            searchEngine: 'strict',
            data: {
                src: $events,
                keys: ['name', 'abbreviation'],
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
                        autoCompleteJS.input.value = event.detail.selection.value.name
                        assignData(event.detail.selection.value.name)
                    },
                    keyup: () => {
                        if (autoCompleteJS.input.value === '')
                            assignData(null)
                    }
                }
            }
        })
    })

    function assignData(name) {
        if (name !== undefined && name !== null)
            data = $events.filter(e => e.name === name)
        else if (data.length <= 1)
            data = $events
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'event'
        })
    }

    function openForm(event) {
        selectedEvent = event instanceof MouseEvent ? null : JSON.parse(JSON.stringify(event))
        editEvent = selectedEvent !== null
        recreateForm = !recreateForm
        UIkit.modal("#modal-full").show()
    }

    function openList(event) {
        selectedEvent = event instanceof MouseEvent ? null : JSON.parse(JSON.stringify(event))
        recreateList = !recreateList
        UIkit.modal("#modal-list").show()
    }

    function openEmails(event) {
        selectedEvent = event instanceof MouseEvent ? null : JSON.parse(JSON.stringify(event))
        recreateList = !recreateList
        UIkit.modal("#modal-emails").show()
    }

    async function processEvent(event) {
        if (event.detail.goto !== undefined) {
            let success = false
            switch (event.detail.goto) {
                case 'cancel':
                    UIkit.modal("#modal-full").hide()
                    UIkit.modal("#modal-list").hide()
                    UIkit.modal("#modal-emails").hide()
                    break
                case 'save':
                    if (!editEvent)
                        success = await createEvent(selectedEvent)
                    else if (selectedEvent.id !== undefined && selectedEvent.id !== null)
                        success = await updateEvent(selectedEvent)
                    if (success)
                        UIkit.notification('<span uk-icon="icon: check"></span> Event ' + (editEvent ? 'updated!' : 'created!'), {
                            status: 'success',
                            pos: 'bottom-center'
                        });
                    else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {
                            status: 'danger',
                            pos: 'bottom-center'
                        });
                    UIkit.modal("#modal-full").hide()
                    dispatchReload()
                    break
                case 'delete':
                    success = await deleteEvent(selectedEvent.id)
                    if (success)
                        UIkit.notification('<span uk-icon="icon: check"></span> Event deleted!', {
                            status: 'success',
                            pos: 'bottom-center'
                        });
                    else
                        UIkit.notification('<span uk-icon="icon: warning"></span> Failed!', {
                            status: 'danger',
                            pos: 'bottom-center'
                        });
                case 'participants':
                    UIkit.modal("#modal-full").hide()
                    UIkit.modal("#modal-list").hide()
                    dispatchReload()
                    break
            }
        }
    }
</script>

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center">
            <input class="uk-input {$screenWidthS ? 'uk-width-small' :  ($screenWidthM || $screenWidthL) ? 'uk-width-medium' : 'uk-width-large'}" id="autocomplete" type="search" spellcheck=false autocorrect="off" autocomplete="off" autocapitalize="off" maxlength="256">
            <button on:click={openForm} class="uk-button uk-button-small uk-button-primary  uk-margin-large-left"><span uk-icon="icon: plus; ratio: 0.6"></span>{$screenWidthS? '' : $screenWidthM ? '\xa0event' : '\xa0New event'}</button>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center" style="max-height: 75%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#if data.length === 0}
            Loading events...
        {:else }
            <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                <thead>
                <tr>
                    <th>Short</th>
                    <th class="uk-visible@m">Name</th>
                    <th>Period</th>
                    <th class="uk-table-shrink uk-text-nowrap">{$screenWidthS ? 'Party' : 'Participants'}</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@m">Bookings</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@m">Capacity</th>
                    <th class="uk-table-shrink uk-text-nowrap uk-visible@s">Emails</th>
                </tr>
                </thead>
                <tbody>
                {#each data as event}
                    <tr class="uk-table-link">
                        <td on:click={() => openForm(event)}>{event.abbreviation}</td>
                        <td class="uk-visible@m" on:click={() => openForm(event)}>{event.name}</td>
                        <td on:click={() => openForm(event)}>{event.start_date !== null && event.end_date !== null ? (DateTime.fromSQL(event.start_date).toFormat('dd LLL yyyy') + ' - ' + DateTime.fromSQL(event.end_date).toFormat('dd LLL yyyy')) : ' — '}</td>
                        <td class="uk-text-success"><a on:click={() => openList(event)} href="{'#'}" uk-icon="list"
                                                       class:uk-text-warning={event.bookings !== null && event.bookings.some(b => !b.confirmed)}
                                                       class:uk-text-danger={event.max_participants !== null && event.max_participants < event.participant_count}> </a></td>
                        <td class="uk-visible@m" on:click={() => openForm(event)}>{event.participant_count}</td>
                        <td class="uk-visible@m" on:click={() => openForm(event)}>{event.max_participants !== null ? event.max_participants : ''}</td>
                        <td class="uk-visible@s"><a on:click={() => openEmails(event)} href="{'#'}" uk-icon="list"> </a></td>
                    </tr>
                {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>

<!-- EVENT form modal -->

<div id="modal-full"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateForm}
                    <EventForm bind:event={selectedEvent} bind:edit={editEvent} on:message={processEvent} />
                {/key}
            </div>
        </div>
    </div>
</div>

<!-- PARTICIPANTS list modal -->

<div id="modal-list"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateList}
                    <EventParticipants bind:event={selectedEvent} on:message={processEvent} />
                {/key}
            </div>
        </div>
    </div>
</div>

<!-- EMAILS list modal -->

<div id="modal-emails"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>

                {#key recreateList}
                    <EventEmails bind:event={selectedEvent} on:message={processEvent} />
                {/key}
            </div>
        </div>
    </div>
</div>